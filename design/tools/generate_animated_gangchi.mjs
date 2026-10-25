import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const designDir = join(root, 'design');
const publicAssetsDir = join(root, 'public/assets');


// ============================================================================
// 1. GANGCHI CHEER 1: Official Taegeukgi Flag Waving
// ============================================================================
function createCheerFlagSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="250 68 255 195" width="510" height="390" fill="none">
  <title>독도 강치 응원 이모티콘 - 태극기 흔들기</title>
  <defs>
    <linearGradient id="fur" x1="350" y1="140" x2="410" y2="230" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f6d6b2"/>
      <stop offset="1" stop-color="#dcb28b"/>
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0c4a75" flood-opacity="0.16"/>
    </filter>
    <filter id="flag-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="1" dy="3" stdDeviation="2.5" flood-color="#0f2942" flood-opacity="0.22"/>
    </filter>
  </defs>

  <!-- 바닥 그림자 -->
  <ellipse cx="362" cy="248" rx="54" ry="8" fill="#164e63" opacity="0.18">
    <animate attributeName="rx" values="54;42;54" dur="0.9s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
    <animate attributeName="opacity" values="0.2;0.1;0.2" dur="0.9s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
  </ellipse>

  <!-- 반짝이 스파클 (좌측) -->
  <g transform="translate(268, 122)">
    <g>
      <path d="M0 -11 Q0 0 11 0 Q0 0 0 11 Q0 0 -11 0 Q0 0 0 -11Z" fill="#fbbf24"/>
      <circle cx="0" cy="0" r="2.5" fill="#ffffff"/>
      <animateTransform attributeName="transform" type="scale" values="0.6;1.15;0.6" dur="1.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite"/>
    </g>
  </g>

  <!-- 반짝이 스파클 (우측 하단) -->
  <g transform="translate(486, 178)">
    <g>
      <path d="M0 -9 Q0 0 9 0 Q0 0 0 9 Q0 0 -9 0 Q0 0 0 -9Z" fill="#38bdf8"/>
      <circle cx="0" cy="0" r="2" fill="#ffffff"/>
      <animateTransform attributeName="transform" type="scale" values="1.1;0.5;1.1" dur="1.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="1;0.25;1" dur="1.4s" repeatCount="indefinite"/>
    </g>
  </g>

  <!-- 강치 + 태극기 메인 그룹 (전체가 일체형으로 통통 점프) -->
  <g id="Gangchi-Main-Bounce">
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 -11; 0 0" dur="0.9s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.35 0 0.65 1;0.35 0 0.65 1"/>

    <!-- 원본 강치 캐릭터 (design/gangchi.svg 구조 100% 유지) -->
    <g id="Gangchi-Character" stroke="#76523b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">

      <!-- 꼬리 지느러미 -->
      <path id="Tail-Flipper" d="M402 185c12-8 23-23 24-36 14 6 8 19 12 23 8 3 17-8 25-5 6 8-8 21-22 24-10 3-17 8-22 14z" fill="#e7bc93">
        <animateTransform attributeName="transform" type="rotate" values="0 402 195; -9 402 195; 4 402 195; 0 402 195" dur="0.9s" repeatCount="indefinite"/>
      </path>

      <!-- 왼쪽 지느러미 -->
      <path id="Left-Flipper" d="M328 173c-14 0-25-17-30-16-9 4-2 20 9 30l15 10z" fill="#edc8a3">
        <animateTransform attributeName="transform" type="rotate" values="0 325 185; 10 325 185; -5 325 185; 0 325 185" dur="0.9s" repeatCount="indefinite"/>
      </path>

      <!-- 몸통 -->
      <path id="Body" d="M328 150c-3-19 5-38 23-42 19-4 39 5 44 24 3 13-1 24 2 36 2 10 16 18 17 32 4 23-16 32-39 32-22 0-47-10-52-29-4-17 3-30 5-53z" fill="url(#fur)"/>

      <!-- 귀 & 머리 윗부분 -->
      <path id="Ears" d="M326 138c-3-4-2-11 2-15 6-5 12-4 14 0M383 128c6-3 13 1 14 9" fill="#e7bc93"/>
      <path id="Head-Top" d="M330 117c2-19 37-26 56-10l8 12" fill="#dfb488"/>

      <!-- 머리띠 -->
      <path id="Headband-Base" d="M329 116c21-7 44-5 65 3l-2 8c-20-8-43-10-64-3z" fill="#fff7e4"/>
      <path id="Headband-Stripe" d="M329 121c21-6 43-4 64 3" stroke="#1972bc" stroke-width="3"/>

      <!-- 머리띠 리본 -->
      <g id="Headband-Ribbon-Group">
        <animateTransform attributeName="transform" type="rotate" values="0 393 122; -10 393 122; 6 393 122; 0 393 122" dur="0.9s" repeatCount="indefinite"/>
        <path id="Headband-Ribbon" d="M393 122l17-10-4 11 10 7-19 2" fill="#fff7e4"/>
        <path id="Headband-Ribbon-Stripe" d="M399 123l8-2M401 128h9" stroke="#1972bc" stroke-width="2"/>
      </g>

      <!-- 눈, 볼터치, 입, 혀, 코, 수염 -->
      <path id="Eyes" d="M342 143c-3-4-8-4-10 1M378 145c-3-4-7-4-9 0"/>
      <circle cx="334" cy="151" r="6" fill="#ff7675" opacity="0.55" stroke="none"/>
      <circle cx="376" cy="152" r="6" fill="#ff7675" opacity="0.55" stroke="none"/>
      <path id="Mouth" d="M347 157c5 2 12 3 16 0-1 10-4 17-10 16-6-1-8-8-6-16z" fill="#b74c43"/>
      <path id="Tongue" d="M348 169c4-4 8-4 12-1" stroke="#ef8e83" stroke-width="3"/>
      <path id="Nose" d="M350 148c0-4 9-4 9 0 0 3-3 5-5 5s-4-2-4-5z" fill="#76523b"/>
      <path id="Whiskers" d="M341 153l-16-2M341 157l-15 3M367 153l15-1M368 158l15 4" stroke-width="1.5"/>

      <!-- 태극기 + 깃대 그룹 (강치 손 위치 (384,225)를 축으로 자연스럽게 흔들림) -->
      <g id="Waving-Taegeukgi" stroke="none">
        <animateTransform attributeName="transform" type="rotate" values="-3 384 225; 6 384 225; -3 384 225" dur="0.9s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>

        <!-- 깃대 (강치 오른손 안쪽에서 우측 상단으로 뻗음) -->
        <line x1="382" y1="234" x2="420" y2="96" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
        <!-- 황금 국기봉 -->
        <circle cx="421" cy="94" r="4.5" fill="#f59e0b" stroke="#b45309" stroke-width="1.2"/>

        <!-- 대한민국 국기 (태극기) : 정부 공식 규격 (144 × 96 원본 비율 축소) -->
        <g transform="translate(423, 96) rotate(14)" filter="url(#flag-shadow)">
          <g transform="translate(33, 22) scale(0.458333)">
            <rect x="-72" y="-48" width="144" height="96" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.2"/>
            <g stroke="#111827" stroke-width="4" stroke-linecap="butt">
              <path transform="rotate(33.6900675)" d="M-50-12v24m6 0v-24m6 0v24m76 0V1m0-2v-11m6 0v11m0 2v11m6 0V1m0-2v-11"/>
              <path transform="rotate(-33.6900675)" d="M-50-12v24m6 0V1m0-2v-11m6 0v24m76 0V1m0-2v-11m6 0v24m6 0V1m0-2v-11"/>
            </g>
            <g transform="rotate(33.6900675)">
              <path fill="#cd2e3a" d="M12 0a18 18 0 1 1-36 0 24 24 0 1 1 48 0"/>
              <path fill="#0047a0" d="M0 0a12 12 0 1 1 24 0 24 24 0 1 1-48 0 12 12 0 1 0 24 0"/>
            </g>
          </g>
        </g>
      </g>

      <!-- 오른쪽 앞 지느러미 (깃대 위를 자연스럽게 감싸 쥐며, 위쪽이 열려 있어 몸통 털과 100% 일체화됨) -->
      <path id="Right-Front-Flipper" d="M365 211c-5 12-1 24 14 30 12 5 21-1 14-8-7-6-5-15-3-22" fill="#f4d5b3"/>
    </g>
  </g>
</svg>`;
}

// ============================================================================
// 2. GANGCHI CHEER 2: Heart Cheering
// 원본 강치(design/gangchi.svg)의 팔·몸통 구조를 100% 그대로 보존하여 분리 현상 원천 차단
// ============================================================================
function createCheerHeartSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="250 68 255 195" width="510" height="390" fill="none">
  <title>독도 강치 응원 이모티콘 - 하트 뿅뿅 칭찬</title>
  <defs>
    <linearGradient id="fur" x1="350" y1="140" x2="410" y2="230" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f6d6b2"/>
      <stop offset="1" stop-color="#dcb28b"/>
    </linearGradient>
    <linearGradient id="heart-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff6b8b"/>
      <stop offset="100%" stop-color="#e11d48"/>
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0c4a75" flood-opacity="0.16"/>
    </filter>
  </defs>

  <!-- 바닥 그림자 -->
  <ellipse cx="368" cy="248" rx="54" ry="8" fill="#164e63" opacity="0.18">
    <animate attributeName="rx" values="54;46;54" dur="1.0s" repeatCount="indefinite"/>
  </ellipse>

  <!-- 퐁퐁 피어오르는 하트 1 (좌측) -->
  <g transform="translate(292, 138)">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 10; -8 -36" dur="1.6s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.4; 1" dur="1.6s" repeatCount="indefinite"/>
      <path d="M 0 -4 C -5 -11 -15 -11 -15 -2 C -15 6 0 13 0 18 C 0 13 15 6 15 -2 C 15 -11 5 -11 0 -4 Z" fill="url(#heart-grad)" filter="url(#soft-shadow)"/>
    </g>
  </g>

  <!-- 퐁퐁 피어오르는 하트 2 (우측 상단) -->
  <g transform="translate(432, 128)">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 12; 10 -38" dur="1.6s" begin="0.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.4; 1" dur="1.6s" begin="0.5s" repeatCount="indefinite"/>
      <path d="M 0 -3 C -4 -9 -12 -9 -12 -1 C -12 5 0 11 0 15 C 0 11 12 5 12 -1 C 12 -9 4 -9 0 -3 Z" fill="#ff4d6d" filter="url(#soft-shadow)"/>
    </g>
  </g>

  <!-- 퐁퐁 피어오르는 하트 3 (좌측 상단 작은 하트) -->
  <g transform="translate(316, 106)">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 8; -5 -28" dur="1.6s" begin="1.0s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0; 1; 0" keyTimes="0; 0.4; 1" dur="1.6s" begin="1.0s" repeatCount="indefinite"/>
      <path d="M 0 -2 C -3 -7 -9 -7 -9 -1 C -9 4 0 8 0 11 C 0 8 9 4 9 -1 C 9 -7 3 -7 0 -2 Z" fill="#fb7185"/>
    </g>
  </g>

  <!-- 원본 강치 캐릭터 전체 그룹 (몸통과 지느러미가 한 덩어리로 귀엽게 갸우뚱 바운스) -->
  <g id="Gangchi-Heart-Sway">
    <animateTransform attributeName="transform" type="rotate" values="-3 365 225; 3 365 225; -3 365 225" dur="1.0s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>

    <g id="Gangchi-Character" stroke="#76523b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <!-- 꼬리 지느러미 -->
      <path id="Tail-Flipper" d="M402 185c12-8 23-23 24-36 14 6 8 19 12 23 8 3 17-8 25-5 6 8-8 21-22 24-10 3-17 8-22 14z" fill="#e7bc93">
        <animateTransform attributeName="transform" type="rotate" values="0 402 195; -10 402 195; 0 402 195" dur="0.8s" repeatCount="indefinite"/>
      </path>

      <!-- 왼쪽 지느러미 -->
      <path id="Left-Flipper" d="M328 173c-14 0-25-17-30-16-9 4-2 20 9 30l15 10z" fill="#edc8a3">
        <animateTransform attributeName="transform" type="rotate" values="0 325 185; 12 325 185; 0 325 185" dur="0.6s" repeatCount="indefinite"/>
      </path>

      <!-- 몸통 (원본 그대로) -->
      <path id="Body" d="M328 150c-3-19 5-38 23-42 19-4 39 5 44 24 3 13-1 24 2 36 2 10 16 18 17 32 4 23-16 32-39 32-22 0-47-10-52-29-4-17 3-30 5-53z" fill="url(#fur)"/>

      <!-- 오른쪽 앞 지느러미 (원본 그대로 몸통에 일체화, 분리선 없음!) -->
      <path id="Right-Front-Flipper" d="M365 211c-5 12-1 24 14 30 12 5 21-1 14-8-7-6-5-15-3-22" fill="#f4d5b3"/>

      <!-- 귀 & 머리 -->
      <path id="Ears" d="M326 138c-3-4-2-11 2-15 6-5 12-4 14 0M383 128c6-3 13 1 14 9" fill="#e7bc93"/>
      <path id="Head-Top" d="M330 117c2-19 37-26 56-10l8 12" fill="#dfb488"/>

      <!-- 머리띠 -->
      <path id="Headband-Base" d="M329 116c21-7 44-5 65 3l-2 8c-20-8-43-10-64-3z" fill="#fff7e4"/>
      <path id="Headband-Stripe" d="M329 121c21-6 43-4 64 3" stroke="#1972bc" stroke-width="3"/>

      <!-- 머리띠 리본 -->
      <g id="Headband-Ribbon-Group">
        <animateTransform attributeName="transform" type="rotate" values="0 393 122; -8 393 122; 5 393 122; 0 393 122" dur="0.8s" repeatCount="indefinite"/>
        <path id="Headband-Ribbon" d="M393 122l17-10-4 11 10 7-19 2" fill="#fff7e4"/>
        <path id="Headband-Ribbon-Stripe" d="M399 123l8-2M401 128h9" stroke="#1972bc" stroke-width="2"/>
      </g>

      <!-- 눈, 발그레 볼터치, 입, 혀, 코, 수염 -->
      <path id="Eyes" d="M342 143c-3-4-8-4-10 1M378 145c-3-4-7-4-9 0"/>
      <ellipse cx="333" cy="151" rx="7" ry="5" fill="#ff4d6d" opacity="0.6" stroke="none"/>
      <ellipse cx="377" cy="152" rx="7" ry="5" fill="#ff4d6d" opacity="0.6" stroke="none"/>
      <path id="Mouth" d="M347 157c5 2 12 3 16 0-1 10-4 17-10 16-6-1-8-8-6-16z" fill="#b74c43"/>
      <path id="Tongue" d="M348 169c4-4 8-4 12-1" stroke="#ef8e83" stroke-width="3"/>
      <path id="Nose" d="M350 148c0-4 9-4 9 0 0 3-3 5-5 5s-4-2-4-5z" fill="#76523b"/>
      <path id="Whiskers" d="M341 153l-16-2M341 157l-15 3M367 153l15-1M368 158l15 4" stroke-width="1.5"/>

      <!-- 가슴에서 콩닥콩닥 뛰는 러블리 하트 배지 -->
      <g transform="translate(356, 192)" stroke="none">
        <g>
          <animateTransform attributeName="transform" type="scale" values="1; 1.18; 1; 1.12; 1" keyTimes="0; 0.25; 0.5; 0.75; 1" dur="1.0s" repeatCount="indefinite"/>
          <path d="M 0 -4 C -5 -12 -16 -12 -16 -2 C -16 7 0 15 0 20 C 0 15 16 7 16 -2 C 16 -12 5 -12 0 -4 Z" fill="url(#heart-grad)" stroke="#ffffff" stroke-width="1.8" filter="url(#soft-shadow)"/>
          <ellipse cx="-5" cy="-4" rx="2.5" ry="4" fill="#ffffff" opacity="0.55" transform="rotate(-25 -5 -4)"/>
        </g>
      </g>
    </g>
  </g>
</svg>`;
}

// ============================================================================
// 3. GANGCHI CHEER 3: Happy Victory Dance
// ============================================================================
function createCheerDanceSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="250 68 255 195" width="510" height="390" fill="none">
  <title>독도 강치 응원 이모티콘 - 신나는 댄스</title>
  <defs>
    <linearGradient id="fur" x1="350" y1="140" x2="410" y2="230" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f6d6b2"/>
      <stop offset="1" stop-color="#dcb28b"/>
    </linearGradient>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0c4a75" flood-opacity="0.16"/>
    </filter>
  </defs>

  <!-- 바닥 그림자 -->
  <ellipse cx="368" cy="248" rx="54" ry="8" fill="#164e63" opacity="0.18">
    <animate attributeName="rx" values="54;40;54" dur="0.7s" repeatCount="indefinite"/>
  </ellipse>

  <!-- 좌측 깔끔한 8분음표 (♫) -->
  <g transform="translate(278, 108)">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 6; -4 -12; 0 6" dur="1.1s" repeatCount="indefinite"/>
      <ellipse cx="-2" cy="14" rx="4.5" ry="3.3" fill="#0284c7" transform="rotate(-18 -2 14)"/>
      <ellipse cx="11" cy="11" rx="4.5" ry="3.3" fill="#0284c7" transform="rotate(-18 11 11)"/>
      <path d="M 2 13 L 2 0 L 15 -3 L 15 10" stroke="#0284c7" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </g>
  </g>

  <!-- 우측 8분음표 (♪) -->
  <g transform="translate(454, 102)">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 -8; 5 8; 0 -8" dur="1.2s" repeatCount="indefinite"/>
      <ellipse cx="0" cy="12" rx="4.8" ry="3.5" fill="#f59e0b" transform="rotate(-20 0 12)"/>
      <line x1="4" y1="10" x2="4" y2="-4" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 4 -4 C 10 -4 12 2 14 4" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    </g>
  </g>

  <!-- 댄스 점프 + 좌우 스텝 그룹 -->
  <g id="Gangchi-Dance-Jump">
    <animateTransform attributeName="transform" type="translate" values="0 0; 0 -13; 0 0" dur="0.7s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.35 0 0.65 1;0.35 0 0.65 1"/>

    <g id="Gangchi-Dance-Tilt">
      <animateTransform attributeName="transform" type="rotate" values="-4 368 220; 4 368 220; -4 368 220" dur="1.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>

      <g id="Gangchi-Character" stroke="#76523b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <!-- 꼬리 -->
        <path id="Tail-Flipper" d="M402 185c12-8 23-23 24-36 14 6 8 19 12 23 8 3 17-8 25-5 6 8-8 21-22 24-10 3-17 8-22 14z" fill="#e7bc93">
          <animateTransform attributeName="transform" type="rotate" values="0 402 195; -12 402 195; 0 402 195" dur="0.7s" repeatCount="indefinite"/>
        </path>

        <!-- 왼쪽 지느러미 -->
        <path id="Left-Flipper" d="M328 173c-14 0-25-17-30-16-9 4-2 20 9 30l15 10z" fill="#edc8a3">
          <animateTransform attributeName="transform" type="rotate" values="-6 325 185; 14 325 185; -6 325 185" dur="0.7s" repeatCount="indefinite"/>
        </path>

        <!-- 몸통 -->
        <path id="Body" d="M328 150c-3-19 5-38 23-42 19-4 39 5 44 24 3 13-1 24 2 36 2 10 16 18 17 32 4 23-16 32-39 32-22 0-47-10-52-29-4-17 3-30 5-53z" fill="url(#fur)"/>

        <!-- 오른쪽 앞 지느러미 (원본 그대로 위쪽 경계선 없이 몸통과 일체화) -->
        <path id="Right-Front-Flipper" d="M365 211c-5 12-1 24 14 30 12 5 21-1 14-8-7-6-5-15-3-22" fill="#f4d5b3"/>

        <!-- 귀 & 머리 -->
        <path id="Ears" d="M326 138c-3-4-2-11 2-15 6-5 12-4 14 0M383 128c6-3 13 1 14 9" fill="#e7bc93"/>
        <path id="Head-Top" d="M330 117c2-19 37-26 56-10l8 12" fill="#dfb488"/>

        <!-- 머리띠 -->
        <path id="Headband-Base" d="M329 116c21-7 44-5 65 3l-2 8c-20-8-43-10-64-3z" fill="#fff7e4"/>
        <path id="Headband-Stripe" d="M329 121c21-6 43-4 64 3" stroke="#1972bc" stroke-width="3"/>

        <!-- 머리띠 리본 -->
        <g id="Headband-Ribbon-Group">
          <animateTransform attributeName="transform" type="rotate" values="0 393 122; -12 393 122; 8 393 122; 0 393 122" dur="0.7s" repeatCount="indefinite"/>
          <path id="Headband-Ribbon" d="M393 122l17-10-4 11 10 7-19 2" fill="#fff7e4"/>
          <path id="Headband-Ribbon-Stripe" d="M399 123l8-2M401 128h9" stroke="#1972bc" stroke-width="2"/>
        </g>

        <!-- 눈, 볼터치, 입, 혀, 코, 수염 -->
        <path id="Eyes" d="M342 143c-3-4-8-4-10 1M378 145c-3-4-7-4-9 0"/>
        <circle cx="334" cy="151" r="6.5" fill="#ff7675" opacity="0.55" stroke="none"/>
        <circle cx="376" cy="152" r="6.5" fill="#ff7675" opacity="0.55" stroke="none"/>
        <path id="Mouth" d="M347 157c5 2 12 3 16 0-1 10-4 17-10 16-6-1-8-8-6-16z" fill="#b74c43"/>
        <path id="Tongue" d="M348 169c4-4 8-4 12-1" stroke="#ef8e83" stroke-width="3"/>
        <path id="Nose" d="M350 148c0-4 9-4 9 0 0 3-3 5-5 5s-4-2-4-5z" fill="#76523b"/>
        <path id="Whiskers" d="M341 153l-16-2M341 157l-15 3M367 153l15-1M368 158l15 4" stroke-width="1.5"/>
      </g>
    </g>
  </g>
</svg>`;
}

const flagSvg = createCheerFlagSvg();
const heartSvg = createCheerHeartSvg();
const danceSvg = createCheerDanceSvg();

for (const dir of [designDir, publicAssetsDir]) {
  writeFileSync(join(dir, 'gangchi-cheer-flag.svg'), flagSvg, 'utf8');
  writeFileSync(join(dir, 'gangchi-cheer-heart.svg'), heartSvg, 'utf8');
  writeFileSync(join(dir, 'gangchi-cheer-dance.svg'), danceSvg, 'utf8');
}

console.log('✅ Updated all 3 Gangchi animations.');
