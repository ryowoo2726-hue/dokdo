// Local previews proxy the API on the same origin; Pages uses the laptop tunnel.
export const apiBase=['localhost','127.0.0.1','[::1]'].includes(location.hostname)
  ? ''
  : 'https://dokdo-api.sangsangbar.com';

export async function postQuiz(path, payload) {
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(apiBase + path, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      break;
    } catch {
      if (attempt === 2) throw Error('퀴즈 서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
      await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 500));
    }
  }
  const result = await response.json().catch(() => ({error: '서버 응답을 확인하지 못했어요.'}));
  if (!response.ok) throw Error(result.error || '서버에 연결하지 못했어요.');
  return result;
}
