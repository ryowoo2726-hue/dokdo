# 독도 퀴즈 · Cloudflare Pages + 노트북 서버

학생 화면: https://dokdo.sangsangbar.com
Pages 기본 주소: https://maseok-dokdo.pages.dev
GitHub: https://github.com/ryowoo2726-hue/dokdo (main 브랜치 → Pages 자동 배포)
API: https://dokdo-api.sangsangbar.com → Cloudflare Tunnel → 노트북 127.0.0.1:8787

## 최초 설정

Node.js 24 LTS와 cloudflared가 필요합니다. 현재 노트북에는 두 도구를 설치했습니다.

1. setup-tunnel.bat을 실행합니다. 브라우저에서 Cloudflare에 로그인하고 sangsangbar.com을 승인합니다.
2. 스크립트가 maseok-dokdo 터널과 API DNS를 만듭니다. 기존 같은 이름의 DNS가 있으면 덮어쓰지 않고 실패합니다. 오류를 확인하고 관련 없는 DNS는 지우지 마세요.
3. Cloudflare Pages의 기존 GitHub 연결 프로젝트에서 프레임워크는 None, 빌드 명령은 npm run build, 출력 디렉터리는 dist로 지정합니다. 루트 디렉터리는 저장소 루트입니다.
4. Pages의 Custom domains에서 dokdo.sangsangbar.com을 추가하고 활성 상태를 확인합니다.
5. 변경한 소스를 GitHub에 올리고 Pages 배포가 완료된 뒤 start-event.bat을 실행합니다.
6. Registered tunnel connection 로그를 확인하고 학생 주소로 접속하여 시작·제출·중복 차단을 확인합니다. 실학생 번호로 시험 제출하면 참여 기록이 남으므로 시험용 번호를 쓰세요.

Pages는 반드시 dist만 배포합니다. questions.json에는 정답이 있으므로 저장소 루트를 배포 디렉터리로 지정하지 마세요. GitHub 저장소가 공개라면 정답 파일도 열람할 수 있으므로 비공개 저장소 운영을 권장합니다.

## 행사 때 켜고 끄기

- 켜기: start-event.bat 더블클릭. 서버와 터널을 함께 실행합니다.
- 끄기: 실행 창에서 Enter 또는 Ctrl+C. 서버·터널·임시 절전 방지를 함께 종료합니다.
- Windows 서비스와 재부팅 자동 실행은 설치하지 않습니다.
- 서버 실행 중에만 시스템 자동 절전을 방지합니다. 충전기를 연결하고 노트북 덮개를 열어 두세요. 수동 절전, 덮개 닫기, 재부팅, 인터넷 단절은 막지 않습니다.
- 꺼져 있는 동안 Pages 화면은 열리지만 시작·제출은 불가능하며 서버 연결 안내가 표시됩니다.
- 학교 네트워크에서 터널 연결이 가능한지는 현장에서 확인해야 합니다.

## 응답과 참여 제한

학년·반·번호 조합으로 최초 제출 1회만 저장합니다. 시작 시 이미 참여했으면 안내하고, 여러 기기에서 동시에 제출해도 서버가 한 번만 저장합니다. 제출 응답이 끊겼을 때 같은 접수번호의 동일 답안을 재전송하면 원래 결과를 돌려줍니다. 일시적인 연결 실패는 같은 답안을 최대 두 번 자동 재시도합니다.

새로 시작하거나 서버를 재부팅해도 참여 기록은 유지됩니다. 이전 버전의 제출 기록도 중복 확인에 반영합니다. 신원 인증은 없으므로 다른 학생의 학년·반·번호를 대신 입력하는 것은 막지 않습니다. 새 행사의 참여 기록 초기화는 백업 후 별도로 처리해야 합니다.

저장 위치: %LOCALAPPDATA%\MaseokDokdo\responses.sqlite
CSV 내보내기: export.bat → %LOCALAPPDATA%\MaseokDokdo\exports
터널 설정: %LOCALAPPDATA%\MaseokDokdo\tunnel\config.yml
Cloudflare 인증 파일: %USERPROFILE%\.cloudflared (Git에 올리거나 공유하지 마세요.)

백업은 서버를 끈 다음 저장 폴더 전체를 복사합니다. 응답은 GitHub나 Pages에 업로드하지 않습니다.

## 로컬 확인과 개발

start.bat은 외부 연결 없이 http://localhost:8787 에서 확인합니다.
npm test는 임시 DB로 500명 제출, 300개 일괄 동시 요청과 네트워크 재시도, 중복 경합, 재시작, 기존 기록 이관, CORS를 검사합니다.
npm run build는 화면 파일만 dist에 복사합니다.

로컬 검사는 인터넷/Cloudflare/학교 Wi-Fi를 포함하지 않습니다. 로컬 300개 신규 연결 중 일부에서 연결 거부가 발생하여 재시도 후 전체 저장을 확인했습니다. 실제 운영 전 학교 네트워크에서 별도 검증해야 합니다.

기본 허용 출처는 학생 도메인, maseok-dokdo.pages.dev와 localhost입니다. 다른 주소에서도 API를 사용하려면 DOKDO_ALLOWED_ORIGINS에 정확한 주소와 기존 허용 출처를 쉼표로 함께 지정하세요. 와일드카드는 쓰지 않습니다.

공식 문서:
- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/tunnel/features/locally-managed-tunnels/create-local-tunnel/
