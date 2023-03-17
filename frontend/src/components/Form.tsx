import { FormEvent } from 'react'

export default function Form({
  errorMessage,
  onSubmit,
}: {
  errorMessage: string
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={onSubmit}>
      <label>
        <span>Type your email and password</span>
        <input type="text" name="email" defaultValue='test@test.com' required />
        <input type="password" name="password" defaultValue='Test1234' required />
      </label>
      <button type="submit">Login</button>

      {errorMessage && <p className="error">{errorMessage}</p>}

    </form>
  )
}
