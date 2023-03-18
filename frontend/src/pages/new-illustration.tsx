import React, { useState } from 'react'
import useUser from '@/library/useUser'
import Layout from '@/components/Layout'
import Form from '@/components/Form'

export default function Login() {
  // here we just check if user is already logged in and redirect to profile
  // should be last page
  const { user } = useUser({
    redirectTo: '/',
  })


  return (
    <Layout>
      <div className="login">
new-illustration
      </div>
    </Layout>
  )
}
