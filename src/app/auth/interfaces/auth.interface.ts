import { JwtPayload } from 'jwt-decode';
import { Role } from '../enums/role.enum';

export interface DecodedToken extends JwtPayload, Record<string, unknown> {
  country: string;
  tenant_id: string;
}

export interface UserInfo {
  roles: Role[];
  country: string;
  tenant_id: string;
  email: string;
}
