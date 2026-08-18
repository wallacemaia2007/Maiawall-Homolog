import { Injectable } from '@angular/core';

import { CONTACT_DATA } from '../data/contact';

@Injectable({
  providedIn: 'root',
})
export class WhatsAppService {
  getWhatsAppNumber(): string {
    return CONTACT_DATA.phone.replace(/\D/g, '');
  }
}
