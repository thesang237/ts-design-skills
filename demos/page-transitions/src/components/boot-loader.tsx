import { BootController } from './boot-controller'

/**
 * Server-rendered and pure CSS, so it can appear before React has loaded.
 * It is display:none unless <html data-loader="on"> is set by the boot script.
 */
export function BootLoader() {
  return (
    <>
      <div id="boot-loader" role="status" aria-live="polite">
        <span className="boot-mark">Studio</span>
        <span className="boot-bar" aria-hidden="true">
          <i />
        </span>
        <span className="sr-only">Loading</span>
      </div>
      <BootController />
    </>
  )
}
