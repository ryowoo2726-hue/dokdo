# 디자인과 운영 파일 구분

현재 기준: [퀴즈 UI — Figma](https://www.figma.com/design/87JIbbUVcdckxNmTsiDWhw?node-id=0-1)

| 피그마 프레임 | 웹 화면 | 담당 스타일 |
| --- | --- | --- |
| `4:3` 태블릿 홈 | 900px 이상 가로 홈, 데스크톱 포함 | `public/css/home.css` |
| `4:4` 태블릿 퀴즈 | 900px 이상 가로 퀴즈, 데스크톱 포함 | `public/css/quiz.css` |
| `4:5` 모바일 세로 홈 | 세로 / 좁은 화면 홈 | `public/css/home.css` |
| `4:6` 모바일 세로 퀴즈 | 세로 / 좁은 화면 퀴즈 | `public/css/quiz.css` |
| `4:7` 모바일 가로 홈 | 700–899px 가로 홈 | `public/css/home.css` |
| `4:8` 모바일 가로 퀴즈 | 700–899px 가로 퀴즈 | `public/css/quiz.css` |
| `18:924` 태블릿 랭킹 | 태블릿·데스크톱 실시간 랭킹 | `public/css/ranking.css` |

결과는 같은 색·카드·버튼 체계로 연결했습니다. 랭킹은 `18:924`를 기준으로 제목·참여 인원·학생 열을 중앙에 정렬하고, 제목 오른쪽에 하트 강치, 목록 왼쪽에 태극기 강치, 오른쪽에 춤추는 강치를 배치했습니다.
최근 요청에 따라 실시간 랭킹 대시보드(`ranking.html`)의 Figma 원본 벡터 파일(`ranking-board-*.svg`)을 `design/`에 신규 생성하였습니다.

## 랭킹 게시판 피그마(Figma) 벡터 에셋 (2026.10 신규)

| 파일명 | 규격 및 용도 | 특징 |
| --- | --- | --- |
| `design/ranking-board-tablet-figma.svg` | **2560 × 1600 (16:10)** 태블릿/키오스크 가로 랭킹보드 | 금/은/동 메달, 학번·닉네임 칩, 점수 알약, 실시간 LIVE 뱃지, 강치 마스코트 포함 |
| `design/ranking-board-mobile-figma.svg` | **1170 × 2532** 모바일 세로 랭킹 화면 | 학생 개인 스마트폰 뷰포트 최적화 벡터 |
| `design/ranking-board-all-in-one-figma.svg` | **3890 × 2600** 통합 캔버스 | 피그마에 한 번에 드래그하여 두 화면을 나란히 작업 가능 |
| `design/ranking-board-preview.html` | 브라우저 전용 대화형 프리뷰 | 브라우저에서 즉시 레이아웃 확인 및 SVG 원클릭 다운로드 제공 |

## 독도 강치 움직이는 응원 이모티콘 에셋 (2026.10 신규)

`design/gangchi.svg` 원본 캐릭터를 기반으로 자체 내장 CSS 키프레임 애니메이션이 적용된 움직이는 응원 스티커 3종 및 전용 스튜디오 뷰어입니다.

| 파일명 | 애니메이션 특징 | 주 응원 콘셉트 |
| --- | --- | --- |
| `design/gangchi-cheer-flag.svg` | 태극기 깃발 펄럭임 + 둠칫둠칫 점프 + 스파클 별 | "독도 파이팅! 🇰🇷" 열정 응원 |
| `design/gangchi-cheer-heart.svg` | 초롱초롱 눈망울 + 짝짝짝 박수 + 퐁퐁 솟는 하트 | "정답이야! 💯 최고!" 칭찬 응원 |
| `design/gangchi-cheer-dance.svg` | 덩실덩실 댄스 스텝 + 윙크 + 둥둥 떠오르는 음표 | "만세! 신난다! 🎉" 기쁨 댄스 |
| `design/tools/gangchi-stickers.html` | 브라우저 전용 이모티콘 스튜디오 | 배경 전환, 즉석 GIF 변환/저장, 링크 복사 제공 |

운영 화면에서 쓰는 강치 SVG 3종만 `public/assets/`에 복사합니다. GIF와 스티커 스튜디오는 디자인 작업용으로만 보관하며 배포하지 않습니다.
답안은 원래의 제출 API를 통해 저장되며 운영 DB·참여 제한·채점 방식은 유지됩니다.

## 그림 원본

- `public/assets/figma/home-scene.svg`: 피그마 `13:618`의 독도·강치 배경을 SVG로 직접 내보냄.
- `public/assets/figma/mobile-home-art.svg`: 피그마 `13:785`의 모바일 홈 그림을 SVG로 직접 내보냄.
- 피그마에서 화면 밖으로 벗어난 퀴즈 그림은 UI 요소와 겹치도록 복제하지 않음. 현재 프레임에 보이는 문제 카드 구성을 따름.
- `public/assets/dokdo.svg`: 운영 화면의 아이콘으로 사용.
- 미사용 강치 원본·이전 마스코트·문항 사진은 `reference-assets/`에 보존. 실제 문항 힌트는 `public/assets/hints/`를 사용.

## 보관 위치

- `archive/`: 이전 전체 화면 SVG 시안·이전 HTML 미리보기. 현재 앱의 소스가 아님.
- `tools/ranking-slide-editor.html`: 랭킹 슬라이드 제작 도구. 필요한 SVG는 `tools/assets/`에 함께 보관.
- `tools/generate_animated_gangchi.mjs`: 강치 SVG 생성 (`node design/tools/generate_animated_gangchi.mjs`).
- `tools/export_gangchi_gifs.mjs`: 디자인용 GIF 생성 (`node design/tools/export_gangchi_gifs.mjs`, 설치된 Edge 사용).
- `tools/generate_ranking_figma.mjs`: 랭킹 디자인 SVG 생성 (`node design/tools/generate_ranking_figma.mjs`).
- `reference-assets/`: 학번·점수 슬롯의 참고 SVG. 실제 앱에서는 CSS와 동적 텍스트를 사용.
- `.local-archive/ui-before-20261025/`: UI 개편 전 파일 백업과 미사용 누적 스타일·보정 모듈. Git과 배포에서 제외.
- `preview/ui/`: `npm run test:ui`가 만드는 화면 캡처. Git과 배포에서 제외.

화면 소스는 `public/`만 수정하고 `npm run build`로 `dist/`를 생성합니다.
