export function FieldError(props: any)
{
    return !props.error ? <></> :
    <div className='nes-text is-error'>{props.error}</div>
}
