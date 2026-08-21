import { Injectable } from '@angular/core';
import { Observable, catchError, from, map, of } from 'rxjs';

export interface ViaCepAddress {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ViaCepService {
  search(cep: string): Observable<ViaCepAddress | null> {
    const normalizedCep = cep.replace(/\D/g, '');

    if (normalizedCep.length !== 8) {
      return of(null);
    }

    return from(
      fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`).then((response) => {
        if (!response.ok) {
          throw new Error('Nao foi possivel consultar o CEP.');
        }

        return response.json() as Promise<ViaCepResponse>;
      }),
    ).pipe(
      map((address) => {
        if (address.erro) {
          return null;
        }

        return {
          cep: address.cep ?? normalizedCep,
          street: address.logradouro ?? '',
          complement: address.complemento ?? '',
          neighborhood: address.bairro ?? '',
          city: address.localidade ?? '',
          state: address.uf ?? '',
        };
      }),
      catchError(() => of(null)),
    );
  }
}
