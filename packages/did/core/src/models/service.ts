export type Service = {
  id: string,
  type: string,
  serviceEndpoint: string | string[] | Record<string, string | string[]>
}