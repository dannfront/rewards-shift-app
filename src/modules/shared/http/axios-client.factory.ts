import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ConfigService } from '@nestjs/config';

export interface AxiosClientConfig {
  baseURL: string;
  withCredentials?: boolean;
  params?: Record<string, unknown>;
}

@Injectable()
export class AxiosClientFactory {
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  constructor(private readonly configService: ConfigService) {}

  createClient(config: AxiosClientConfig): AxiosInstance {
    return axios.create({
      baseURL: config.baseURL,
      withCredentials: config.withCredentials ?? true,
      headers: {
        'User-Agent': this.userAgent,
      },
      params: config.params,
      maxRedirects: 0,
      validateStatus: () => true,
    });
  }

  createShiftClient(): AxiosInstance {
    return this.createClient({
      baseURL: this.configService.get<string>('BASE_URL') ?? '',
      withCredentials: true,
    });
  }
}

export interface AxiosClientUtil {
  get(url: string, config?: AxiosRequestConfig): Promise<unknown>;
  post(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<unknown>;
}

@Injectable()
export class ShiftAxiosClient {
  private readonly client: AxiosInstance;

  constructor(private readonly factory: AxiosClientFactory) {
    this.client = this.factory.createShiftClient();
  }

  async get(url: string, config?: AxiosRequestConfig) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.client.post(url, data, config);
  }
}
