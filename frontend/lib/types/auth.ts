export type LoginByEmail = {
  email: string
  password: string
}

export type LoginByPhone = {
  phone: string
  password: string
}

export type LoginPayload = LoginByEmail | LoginByPhone

export type RegisterPayload = {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  password: string
}
