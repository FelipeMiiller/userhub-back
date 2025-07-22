import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpClientException } from '../exception/http-client.exception';

@Injectable()
export class HttpClient {
  constructor(private readonly httpService: HttpService) {}

  async get<T extends Record<string, any>>(url: string, options: Record<string, any>): Promise<T> {
    const { data } = await firstValueFrom(
      this.httpService.get<T>(url, options).pipe(
        catchError((error: AxiosError) => {
          throw new HttpClientException(`Error fetching data from ${url}: ${error}`);
        }),
      ),
    );
    return data;
  }

  async post<T = any>(url: string, body: any, options?: Record<string, any>): Promise<T> {
    const { data } = await firstValueFrom(
      this.httpService.post<T>(url, body, options).pipe(
        catchError((error: AxiosError) => {
          throw new HttpClientException(`Error posting data to ${url}: ${error.message}`);
        }),
      ),
    );
    return data;
  }
}
