import ReCAPTCHA from 'react-google-recaptcha'
import { forwardRef } from 'react'

type RecaptchaWidgetProps = {
  onVerify: (token: string | null) => void
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined
const ENABLED = import.meta.env.VITE_RECAPTCHA_ENABLED === 'true'

export const RecaptchaWidget = forwardRef<ReCAPTCHA, RecaptchaWidgetProps>(
  ({ onVerify }, ref) => {
    if (!ENABLED || !SITE_KEY) {
      return null
    }

    return (
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={ref}
          sitekey={SITE_KEY}
          theme="dark"
          onChange={onVerify}
        />
      </div>
    )
  }
)

RecaptchaWidget.displayName = 'RecaptchaWidget'

export function isRecaptchaRequired() {
  return ENABLED && Boolean(SITE_KEY)
}
