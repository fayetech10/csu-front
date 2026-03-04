import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Adherent } from "../models/enroulement.model";

export interface PhotoMetadata {
  filename: string;
  type: string; // profile, recto, verso
  size: number;
  lastModified: number;
}

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

  getPhotos(): Observable<PhotoMetadata[]> {
    return this.http.get<PhotoMetadata[]>(`${this.apiUrl}/photos`);
  }

  getPhotoUrl(filename: string): string {
    return `${this.apiUrl}/photos/${filename}`;
  }

  updateAdherent(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/adherents/${id}`, data);
  }

  deleteAdherent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/adherents/${id}`, { responseType: 'text' });
  }

  downloadPhotosZip(startDate?: string, endDate?: string, type?: string): Observable<Blob> {
    let params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (type && type !== 'all') params.type = type;

    return this.http.get(`${this.apiUrl}/photos/download`, {
      params,
      responseType: 'blob'
    });
  }
}

