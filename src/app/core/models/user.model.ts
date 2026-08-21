export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
  avatarUrl?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  address?: UserAddress;
  gender?: string;
  profession?: string;
  company?: string;
}

export interface UserAddress {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export type UserProfileUpdatePayload = Partial<
  Pick<User, 'name' | 'email' | 'cpf' | 'phone' | 'birthDate' | 'gender' | 'profession' | 'company'>
> & {
  address?: UserAddress;
};
