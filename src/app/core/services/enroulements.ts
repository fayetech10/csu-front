import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Adherent } from "../models/enroulement.model";

@Injectable({ providedIn: 'root' })
export class EnroulementService {
  private apiUrl = 'http://localhost:8080/api'; // Changez l'URL selon votre environnement
  constructor(private http: HttpClient) { }

  getAdherents(): Observable<{ message: string, data: Adherent[] }> {
    return this.http.get<{ message: string, data: Adherent[] }>(`${this.apiUrl}/adherents/all`);
  }

  exportAdherentsExcel(startDate?: string, endDate?: string): Observable<Blob> {
    let params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get(`${this.apiUrl}/excel/adherents`, {
      params,
      responseType: 'blob'
    });
  }
}

