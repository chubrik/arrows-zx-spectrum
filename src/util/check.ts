export function check(condition: boolean, message: string = 'Check failed') {
  if (!condition)
    throw new Error(message);
}
