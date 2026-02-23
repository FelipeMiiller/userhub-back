export class HttpClientInternalException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class HttpClientException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
