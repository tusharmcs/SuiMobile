/// Helpers to interact with the Sui network

import { JsonRpcProvider, SuiTransactionResponse, GetObjectDataResponse, SuiObjectInfo, Network } from '@mysten/sui.js';

const SUI_PACKAGE_DEVNET = '0xfbc6b5171b172684fdb9b0ba08f8967ec9f5e85d';
const SUI_PACKAGE_DEVNET_SPECIAL = '0xfbc6b5171b172684fdb9b0ba08f8967ec9f5e85d';

// const SUI_PACKAGE_DEVNET = '0xe3c84816ff7131135f56802bf4ddee7e1309391a';
// const SUI_PACKAGE_DEVNET_SPECIAL = '0x29619c35c22cec86e0a2d2ceeb77b2429238f67f';

const SUI_PACKAGE_TESTNET = '0x123';
const SUI_PACKAGE_TESTNET_SPECIAL = '0x123';
const RPC_DEVNET = new JsonRpcProvider(Network.DEVNET);
const RPC_TESTNET = new JsonRpcProvider('https://fullnode.testnet.sui.io:443');

export function getPackageAndRpc(network: string): [string, JsonRpcProvider] {
    const special = !!localStorage.getItem('polymedia.special');
    switch (network) {
        case 'devnet':
            return [special ? SUI_PACKAGE_DEVNET_SPECIAL : SUI_PACKAGE_DEVNET, RPC_DEVNET];
        case 'testnet':
            return [special ? SUI_PACKAGE_TESTNET_SPECIAL : SUI_PACKAGE_TESTNET, RPC_TESTNET];
        default:
            throw new Error('Invalid network: ' + network);
    }
}

/// Represents a `SUI::suistartup::Suistartup<T>` Sui object.
export type Suistartup = {
    id: string, // The Sui object UID
    collatType: string, // The type of collateral, i.e. the `T` in `Suistartup<T>`
    title: String,
    start_date: String,
    end_date: String,
    cap: number,
    raised: number,
    description: string,
    quorum: number,
    size: number,
    whitelistedaddress: string[],
    owner: string[],
    phase: string,
    invests: object,
    answers: object,
};

/// Fetch and parse a `SUI::suistartup::Suistartup<T>` Sui object into our custom Suistartup type
export async function getSuistartup(network: string, objId: string): Promise<Suistartup | null> {
    // console.debug('[getSuistartup] Looking up:', objId);

    const getPhaseName = (phaseCode: number): string => {
        return ['investing', 'voting', 'settled', 'canceled', 'stalemate'][phaseCode];
    };

    const getCollateralType = (suistartupType: string): string => {
        const match = suistartupType.match(/<(.+)>$/);
        return match ? match[1] : 'ERROR_TYPE_NOT_FOUND';
    };

    const [packageId, rpc] = getPackageAndRpc(network);

    // Handle leading zeros ('0x00ab::suistartup::Suistartup' is returned as '0xab::suistartup::Suistartup' by the RPC)
    const packageName = packageId.replace(/0x0+/, '0x0*'); // handle leading zeros
    const suistartupTypeRegex = new RegExp(`^${packageName}::suistartup::Suistartup<0x.+::.+::.+>$`);
    return rpc.getObject(objId)
        .then((obj: GetObjectDataResponse) => {
            if (obj.status != 'Exists') {
                // console.warn('[getSuistartup] Object does not exist. Status:', obj.status);
                return null;
            }

            const details = obj.details as any;
            if (!details.data.type.match(suistartupTypeRegex)) {
                // console.warn('[getSuistartup] Found wrong object type:', details.data.type);
                return null;
            } else {
                // console.debug('[getSuistartup] Found suistartup object:', obj);

                const fields = details.data.fields;

                // Parse `Suistartup.invests: VecMap<address, Coin<T>>`
                let invests = fields.invests.fields.contents || [];
                let investsByPlayer = new Map(invests.map((obj: any) =>
                    [obj.fields.key, obj.fields.value.fields.balance]
                ));

                // Parse `Suistartup.answers: VecMap<address, String>`
                let answers = fields.answers.fields.contents || [];
                let answersByPlayer = new Map(answers.map((obj: any) =>
                    [obj.fields.key, obj.fields.value]
                ));

                // Parse `Suistartup.clams: VecMap<address, address>`
                let clams = fields.clams.fields.contents || [];
                let clamsByJudge = new Map();
                let clamsByPlayer = new Map();
                clams.forEach((obj: any) => {
                    let judgeAddr = obj.fields.key;
                    let playerAddr = obj.fields.value;
                    clamsByJudge.set(judgeAddr, playerAddr);
                    clamsByPlayer.set(playerAddr, 1 + (clamsByPlayer.get(playerAddr) || 0));
                });

                const suistartup: Suistartup = {
                    id: fields.id.id,
                    collatType: getCollateralType(details.data.type),
                    title: fields.title,
                    start_date: fields.start_date,
                    end_date: fields.end_date,
                    cap: fields.cap,
                    raised: fields.raised,
                    description: fields.description,
                    quorum: fields.quorum,
                    size: fields.size,
                    whitelistedaddress: fields.whitelistedaddress,
                    owner: fields.owner,
                    phase: getPhaseName(fields.phase),
                    invests: investsByPlayer,
                    answers: answersByPlayer,
                };
                return suistartup;
            }
        })
        .catch(error => {
            // console.warn('[getSuistartup] RPC error:', error.message);
            return null;
        });
}

/// Get all `Coin<T>` objects owned by the current address
export async function getCoinObjects(network: string, address: string, type: string): Promise<any[]> {
    // console.debug('[getCoinObjects] Looking for Coin objects of type:', type);
    const [_packageId, rpc] = getPackageAndRpc(network);
    return rpc.getObjectsOwnedByAddress(address) // TODO: use https://docs.sui.io/sui-jsonrpc#sui_getCoins
        .then((objectsInfo: SuiObjectInfo[]) => {
            const expectedType = `0x2::coin::Coin<${type}>`;
            let objectIds = objectsInfo.reduce((selected: string[], obj: SuiObjectInfo) => {
                if (obj.type == expectedType)
                    selected.push(obj.objectId);
                return selected;
            }, []);
            return rpc.getObjectBatch(objectIds)
                .then(objectsData => { return objectsData })
                .catch(_error => []);
        })
        .catch(_error => []);
}

/// Get recent suistartup transactions
export async function getRecentTxns(network: string, limit: number): Promise<SuiTransactionResponse[]> {
    const errorCatcher = (error: any) => {
        // console.warn('[getRecentTxns] RPC error:', error.message);
        return [];
    };

    const [packageId, rpc] = getPackageAndRpc(network);

    // @ts-ignore
    const transactions = await rpc.client.batchRequest([{
        method: 'sui_getTransactions',
        args: [{ InputObject: packageId }, null, limit, true],
    }])
        .then(response => response[0].result.data)
        .catch(errorCatcher);

    return rpc.getTransactionWithEffectsBatch(transactions).catch(errorCatcher);
}

export function getErrorName(error?: string): string {
    if (!error) {
        return 'unknown error';
    }

    const noBalanceTxt = 'Unable to select a gas object with balance greater than or equal to';
    if (error.includes(noBalanceTxt)) {
        return 'Your wallet doesn\'t have enough balance to pay for the transaction';
    }

    const match = error.match(/^MoveAbort.+, (\d+)\)$/)
    if (!match) {
        return error;
    }
    const errCode = match[1];
    const errorNames: Record<string, string> = { // from suistartup.move
        // create()
        '0': 'E_JUDGES_CANT_BE_PLAYERS',
        '2': 'E_INVALID_NUMBER_OF_PLAYERS',
        '3': 'E_INVALID_NUMBER_OF_JUDGES',
        '4': 'E_DUPLICATE_PLAYERS',
        '5': 'E_DUPLICATE_JUDGES',
        '6': 'E_INVALID_QUORUM',
        '7': 'E_INVALID_SUISTARTUP_SIZE',
        // invest()
        '100': 'E_ONLY_PLAYERS_CAN_INVEST',
        '101': 'E_ALREADY_INVESTED',
        '102': 'E_INVESTS_BELOW_SUISTARTUP_SIZE',
        '103': 'E_NOT_IN_INVESTING_PHASE',
        '104': 'E_CAP_REACHED',
        // vote()
        '200': 'E_NOT_IN_VOTING_PHASE',
        '201': 'E_ONLY_JUDGES_CAN_CLAM',
        '202': 'E_ALREADY_CLAMD',
        '203': 'E_PLAYER_NOT_FOUND',
        // cancel()
        '300': 'E_SUISTARTUP_HAS_INVESTS',
        '301': 'E_NOT_AUTHORIZED',
    };
    return errorNames[errCode] || error;

}