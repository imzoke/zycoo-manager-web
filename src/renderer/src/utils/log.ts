export function warn(message: string): void {
  console.warn(`[ZMW warn]:${message}`);
}

export function error(message: string): void {
  throw new Error(`[ZMW error]:${message}`);
}
