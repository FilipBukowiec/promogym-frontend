import { Injectable } from "@angular/core";
import { HttpHeaders } from "@angular/common/http";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { catchError, map, switchMap, take } from "rxjs/operators";
import { jwtDecode } from "jwt-decode";
import { Tenant } from "../models/tenant.model";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$ = this.isAdminSubject.asObservable();

  private selectedTenantSubject = new BehaviorSubject<Tenant | null>(null);
  public selectedTenant$ = this.selectedTenantSubject.asObservable();

  private userEmailSubject = new BehaviorSubject<string>("");
  public userEmail$ = this.userEmailSubject.asObservable();

  private userTenantSubject = new BehaviorSubject<string>("");
  public userTenant$ = this.userTenantSubject.asObservable();

  private userCountrySubject = new BehaviorSubject<string>("");
  public userCountry$ = this.userCountrySubject.asObservable();

  private isPremiumSubject = new BehaviorSubject<boolean>(false);
  public isPremium$ = this.isPremiumSubject.asObservable();



  constructor(private auth0: Auth0Service) { }

  // 📌 Pobranie nagłówków z tokena
  getAuthHeaders(): Observable<HttpHeaders> {
    return this.auth0.getAccessTokenSilently().pipe(
      catchError((error) => {
        console.error("Błąd pobierania tokena:", error);
        if (
          error.error === "login_required" ||
          error.error === "consent_required"
        ) {
          this.auth0.loginWithRedirect();
          return throwError(() => new Error("Login required"));
        }
        return throwError(() => new Error("Nie udało się pobrać tokena"));
      }),
      switchMap((token) => {
        try {
          const decodedToken: any = jwtDecode(token);
          const defaultTenantId = decodedToken.tenant_id;
          const defaultCountry = decodedToken.country;

          return this.isAdmin$.pipe(
            take(1),
            switchMap((isAdmin) => {
              if (!isAdmin) {
                const headers = new HttpHeaders()
                  .set("Authorization", `Bearer ${token}`)
                  .set("tenant-id", defaultTenantId)
                  .set("country", defaultCountry);
                return of(headers);
              }

              return this.selectedTenant$.pipe(
                take(1),
                map((selectedTenant) => {
                  const tenantIdToUse =
                    selectedTenant?.tenant_id || defaultTenantId;
                  const countryToUse =
                    selectedTenant?.country || defaultCountry;

                  const headers = new HttpHeaders()
                    .set("Authorization", `Bearer ${token}`)
                    .set("tenant-id", tenantIdToUse)
                    .set("country", countryToUse);

                  return headers;
                })
              );
            })
          );
        } catch (decodeError) {
          return throwError(() => new Error("Błąd dekodowania tokena"));
        }
      })
    );
  }

  getUserData(): Observable<{ roles: string[]; country: string }> {
    return this.auth0.getAccessTokenSilently().pipe(
      map(token => {
        const decodedToken: any = jwtDecode(token);
        return {
          roles: decodedToken["https://promogym.com/roles"] || [],
          country: decodedToken.country || "",
        };
      })
    );
  }

  checkIfAdmin(): void {
    this.getUserData().pipe(
      map(user => user.roles.includes("admin")),
      take(1)
    ).subscribe(isAdmin => this.isAdminSubject.next(isAdmin))
  }


 checkIfPremiumUser(): void {
  this.getUserData().pipe(
    take(1)
  ).subscribe(user => {
    console.log("👤 Roles from token:", user.roles);
    const isPremium = user.roles.includes("premium_user");
    console.log("🌟 Is Premium:", isPremium);
    this.isPremiumSubject.next(isPremium);
  });
}

  setSelectedTenant(tenant: Tenant): void {
    this.selectedTenantSubject.next(tenant);
  }

  getUserInfo(): void {
    this.auth0
      .getAccessTokenSilently()
      .pipe(
        switchMap((token) => {
          const decodedToken: any = jwtDecode(token);
          const tenantId = decodedToken.tenant_id || "";
          const country = decodedToken.country || "";

          return this.auth0.user$.pipe(
            take(1),
            map((user) => {
              const email = user?.email || "";
              this.userCountrySubject.next(country);
              this.userEmailSubject.next(email);
              this.userTenantSubject.next(tenantId);
              this.selectedTenantSubject.next({tenant_id: tenantId, country})
            })
          );
        }),
        catchError((err) => {
          console.error("❌ Błąd przy pobieraniu danych użytkownika:", err);
          this.userCountrySubject.next("");
          this.userEmailSubject.next("");
          this.userTenantSubject.next("");
          return of(null);
        })
      )
      .subscribe();
  }
}
