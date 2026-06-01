type FormErrorProps = {
  id?: string
  message?: string
}

export default function FormError({ id, message }: FormErrorProps) {
  if (!message) return null

  return (
    <p className="mt-2 px-2 text-sm font-medium text-red-100" id={id} role="alert">
      {message}
    </p>
  )
}
