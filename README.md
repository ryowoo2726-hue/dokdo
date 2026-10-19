# 독도 퀴즈 · GitHub Pages 배포 준비

저장소: https://github.com/ryowoo2726-hue/dokdo

**학생 화면은 GitHub Pages에서 작동합니다.** Apps Script는 구글 시트에 답안을 저장하고 채점하는 기능만 맡습니다. Cloudflare·별도 DB·유료 서버는 사용하지 않습니다.

학년·반·번호만 입력받습니다. 최신 `독도_퀴즈_10선.txt`에 맞춰 **4지선다 7문항 + OX 3문항**, 각 10점입니다. 주관식은 없습니다.

## 1. Apps Script 저장 기능 준비

1. 제공하신 응답 시트에서 **확장 프로그램 → Apps Script**를 엽니다.
2. `apps-script/Code.gs` 전체 내용을 기본 Code.gs에 붙여 넣습니다.
3. **+ → HTML**로 이름이 **Bridge**인 파일을 만들고 `apps-script/Bridge.html`을 붙여 넣습니다. 이전 Index 파일은 사용하지 않습니다.
4. **setup_** 함수를 한 번 실행하고 구글 권한을 승인합니다.
5. **배포 → 새 배포 → 웹 앱**에서 **실행 사용자: 나**로 지정합니다. 학생이 별도 로그인 없이 쓰려면 접근 권한을 **모든 사용자**로 지정해야 합니다. 학교 정책에서 허용하는지 확인합니다.
6. 발급된 **https://script.google.com/macros/s/…/exec** 주소를 복사합니다. 이 주소는 저장 기능 연결용이며 학생에게 배포할 퀴즈 화면 주소가 아닙니다.

제공하신 시트 ID는 Code.gs에 이미 설정했습니다. 시트의 링크 공유 설정은 API 인증을 대체하지 않습니다. 실제 쓰기는 Apps Script가 선생님 권한으로 수행합니다.

## 2. 이 저장소에 파일 올리기

`dokdo-quiz` 폴더 **안의 내용**을 GitHub 저장소 최상위에 올립니다. index.html이 저장소 첫 화면에 보이는 위치여야 합니다. `.github/workflows/pages.yml`도 반드시 포함합니다.

주요 파일: index.html, style.css, app.js, sheets-bridge.js, config.js, questions.js, questions.json, assets/, apps-script/, build.mjs, tests.mjs, package.json, .gitignore, .github/.

로컬 Git의 origin은 제공하신 저장소로 설정해 두었습니다. 아직 원격 업로드·배포는 수행하지 않았습니다. 검토 후 로컬 변경 내용을 커밋하고 main 브랜치로 올리거나, ZIP을 풀어 GitHub에 업로드하세요. ZIP 파일 자체를 올리는 방식은 아닙니다.

## 3. GitHub Pages 설정

1. 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 선택합니다.
2. **Settings → Secrets and variables → Actions → Variables → New repository variable**에서 이름을 **APPS_SCRIPT_URL**, 값을 위 /exec 주소로 저장합니다. 이 주소는 공개 가능한 웹 앱 주소이며 비밀 키는 넣지 않습니다.
3. **Actions → GitHub Pages 배포 → Run workflow**를 눌러 배포합니다.
4. 워크플로에서 코드 검사와 운영용 빌드를 거쳐 `dist` 안의 화면 파일만 게시합니다. Apps Script 소스와 문항 정답 파일을 사이트 배포 파일로 올리지 않습니다. 다만 공개 저장소의 소스 자체는 누구나 읽을 수 있습니다.
5. 성공한 배포 결과에 표시된 Pages 주소를 학생들에게 안내합니다.

저장소 기준 예상 주소는 **https://ryowoo2726-hue.github.io/dokdo/** 입니다. 아직 배포된 주소로 검증된 상태는 아닙니다.

현재 배포는 수동 실행 방식입니다. 코드를 올리기만 해서는 자동 배포하지 않습니다. APPS_SCRIPT_URL이 비어 있으면 운영 배포를 중단하여 미리보기를 수집용으로 잘못 공개하지 않도록 했습니다.

## 화면 확인과 수정

`index.html`을 브라우저로 열면 이름 없이 객관식·OX 퀴즈를 체험할 수 있습니다. 기본 config.js는 주소가 비어 있어 **미리보기 모드이며 응답을 저장하지 않습니다**.

- style.css: 디자인
- questions.json: 10문항·선택지·정답·해설 원본
- app.js: 문항 이동·선택·점수·해설 화면
- sheets-bridge.js: GitHub 화면과 시트 저장 기능 연결
- apps-script/Code.gs: 서버 채점과 직접 시트 저장
- apps-script/Bridge.html: Apps Script 연결 페이지

문항을 수정한 뒤 `node build.mjs`를 실행하면 questions.js와 Code.gs의 문항이 갱신됩니다. 서버 문항을 바꿨다면 Apps Script Code.gs도 바꾸고 배포 관리에서 **새 버전**으로 업데이트하세요.

패키지 설치는 필요 없습니다. Node.js 24 권장:

    node build.mjs
    node --test tests.mjs

## 저장과 운영

학생 정보는 학년·반·번호만 수집합니다. 시트에는 제출 시각·학년·반·번호·점수·정답 수·소요 시간·10문항 응답을 기록합니다. 오른쪽 숨김 열 두 개는 응시 ID와 재제출 처리용 결과입니다.

같은 응시 토큰으로 재제출하면 중복 기록하지 않습니다. 새로 시작한 응시는 별도 행입니다. 첫 행 제목과 숨긴 열은 바꾸지 마세요. 저장 실패 시 작성한 답은 유지되지만, 새로고침·창 닫기 후에는 미제출 답이 복구되지 않습니다.

GitHub 화면은 시트 저장 성공 응답을 받은 뒤에만 완료를 표시합니다. 이름은 수집하지 않으며, 학년·반·번호는 직접 입력하는 정보이므로 본인 인증이나 학생별 1회 제한은 아닙니다.

Apps Script 연결은 지정한 GitHub 원본(`https://ryowoo2726-hue.github.io`)의 요청만 브리지에서 받습니다. GitHub Pages 화면에서 Apps Script의 내부 iframe과 통신하므로 실제 /exec 주소를 연결한 후 휴대폰에서 최종 제출 테스트가 필요합니다. 학교의 익명 웹 앱 또는 iframe 제한이 있으면 연결이 차단될 수 있습니다.

GitHub Pages가 화면을 제공해도 Apps Script의 동시 실행 제한은 남습니다. 이전 Cloudflare 구성의 1,000명 로컬 테스트 결과는 적용되지 않으므로 제출 시간을 분산하세요.

아직 수행하지 않은 단계: 실제 Apps Script 배포·권한 승인, 실제 /exec 연결, GitHub 업로드·Pages 배포, 브라우저 실화면 및 실제 시트 저장 통합 확인.
