# 독도 퀴즈 · Cloudflare Pages + 노트북 응답 저장 서버

학생 화면: https://dokdo.sangsangbar.com
Pages 기본 주소: https://maseok-dokdo.pages.dev
GitHub: https://github.com/ryowoo2726-hue/dokdo
API: https://dokdo-api.sangsangbar.com → Cloudflare Tunnel → 노트북 127.0.0.1:8787

## 역할

- GitHub/Pages: 화면, questions.json의 문제·정답·해설, quiz.mjs의 브라우저 채점.
- 노트북: 학년·반·번호별 중복 참여 확인과 학생 선택 답안 저장.
- 백엔드는 문제·정답을 읽거나 제공하지 않으며, 채점하거나 점수를 저장하지 않습니다.
- 저장 내용: 접수번호, 학년·반·번호, 선택 답안, 문제 버전, 시작·접수 시각. 저장 성공 후 브라우저에서 점수·해설을 표시합니다.
- 문제·정답은 공개 파일입니다. 문제 변경은 questions.json 수정 후 GitHub main에 올리면 Pages가 자동 배포합니다. 백엔드의 문제 파일을 맞춰 줄 필요가 없습니다.
- 문제 버전은 브라우저에서 문제 데이터의 SHA-256으로 생성합니다. 서버는 버전 형식과 답안 형식만 검사하며 정답이나 문항별 선택 범위를 검증하지 않습니다.

## 운영

1. 최초 연결은 setup-tunnel.bat으로 Cloudflare 로그인과 sangsangbar.com 승인을 진행합니다. 현재 노트북에는 Node.js 24와 cloudflared를 설치하고 maseok-dokdo 터널을 연결했습니다.
2. 켜기: start-event.bat 더블클릭. 서버와 터널이 함께 실행됩니다.
3. 끄기: 실행 창에서 Enter 또는 Ctrl+C. 서버·터널·임시 절전 방지를 함께 종료합니다.
4. 충전기를 연결하고 노트북 덮개를 열어 두세요. 서버 실행 중에만 시스템 자동 절전을 방지합니다. 수동 절전·덮개 닫기·인터넷 단절은 막지 않습니다.
5. 프로그램 수정 당시 서버가 켜져 있었다면 종료 후 start-event.bat을 다시 실행해야 새 코드가 적용됩니다.

Windows 서비스와 재부팅 자동 실행은 설치하지 않습니다. 서버가 꺼져 있으면 화면·문제 파일은 Pages에서 열리지만, 중복 확인과 답안 저장을 위해 퀴즈 시작·제출에는 서버 연결이 필요합니다.

Pages 프로젝트: maseok-dokdo / 저장소: ryowoo2726-hue/dokdo / main 브랜치
빌드 명령: npm run build / 출력 폴더: dist / 프레임워크: None
학생 도메인은 Pages Custom domains 등록과 DNS의 CNAME dokdo → maseok-dokdo.pages.dev 연결이 필요합니다.

## 참여 제한과 보관

학년·반·번호 조합으로 최초 제출 한 번만 저장합니다. 여러 기기에서 동시에 제출해도 한 번만 저장하며, 동일 접수번호·동일 답안의 재전송은 기존 저장 확인을 반환합니다. 시작만 하고 제출하지 않은 학생은 다시 시작할 수 있습니다.

재시작 후에도 참여 기록을 유지하며 이전 버전 제출도 중복 확인에 반영합니다. 기존 DB와 기존 기록은 보존합니다. 이전 버전에서 저장한 점수·해설은 기존 기록에 남지만 새 제출은 저장 확인 정보만 기록합니다.

신원 인증은 없으므로 다른 학생의 학년·반·번호를 대신 입력하는 것은 막지 않습니다. 새 행사 참여 기록 초기화는 백업 후 별도로 처리합니다.

저장 위치: %LOCALAPPDATA%\MaseokDokdo\responses.sqlite
CSV 내보내기: export.bat → %LOCALAPPDATA%\MaseokDokdo\exports
CSV에는 학생 정보·문제 버전·문항별 선택번호(1부터)를 기록하고 점수는 포함하지 않습니다.
백업은 서버를 끈 다음 저장 폴더 전체를 복사합니다. 응답 DB와 CSV는 GitHub/Pages에 업로드하지 않습니다.

터널 설정: %LOCALAPPDATA%\MaseokDokdo\tunnel\config.yml
Cloudflare 인증 파일: %USERPROFILE%\.cloudflared (공유하지 마세요.)

## 개발 확인

npm test: 임시 DB로 500명 저장, 300개 동시 요청과 네트워크 재시도, 중복 경합, 재시작, 기존 기록 이관, CORS, 브라우저 채점 검사.
npm run build: 화면·문제·채점 파일만 dist에 복사. 백엔드·인증 파일·응답 DB는 제외.
start.bat: 터널 없이 로컬 저장 API만 실행. /health로 확인하며 학생 화면은 Pages에서 엽니다.

로컬 부하 검사는 인터넷/Cloudflare/학교 Wi-Fi를 포함하지 않습니다. 학교 네트워크에서도 별도 확인해야 합니다.
허용 출처는 학생 도메인, maseok-dokdo.pages.dev, localhost입니다. DOKDO_ALLOWED_ORIGINS 환경 변수로 정확한 출처를 쉼표로 지정할 수 있습니다.
