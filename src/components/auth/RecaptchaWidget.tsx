import ReCAPTCHA from 'react-google-recaptcha'
import { forwardRef } from 'react'

type RecaptchaWidgetProps = {
  onVerify: (token: string | null) => void
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined

// VITE_RECAPTCHA_ENABLED=false explicitly disables the widget (dev bypass).
// Absent or any other value = enabled whenever SITE_KEY is present.
const EXPLICITLY_DISABLED = import.meta.env.VITE_RECAPTCHA_ENABLED === 'false'

/** True when the reCAPTCHA widget will be rendered and its token is required. */
export function isRecaptchaRequired(): boolean {
  return Boolean(SITE_KEY) && !EXPLICITLY_DISABLED
}

export const RecaptchaWidget = forwardRef<ReCAPTCHA, RecaptchaWidgetProps>(
  ({ onVerify }, ref) => {
    if (!isRecaptchaRequired()) {
      return null
    }

    return (
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={ref}
          sitekey={SITE_KEY as string}
          theme="dark"
          onChange={onVerify}
        />
      </div>
    )
  },
)

RecaptchaWidget.displayName = 'RecaptchaWidget'
