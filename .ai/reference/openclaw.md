- https://www.linkedin.com/posts/q00_%EC%A0%9C%EA%B0%80-%EC%9E%A0%EB%93%A0-%EC%82%AC%EC%9D%B4-%EB%91%90-ai-%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8%EA%B0%80-%EC%84%9C%EB%A1%9C%EC%9D%98-%ED%95%9C%EA%B3%84%EB%A5%BC-%EC%9D%B8%EC%A7%80%ED%95%98%EA%B3%A0-%EC%8A%A4%EC%8A%A4%EB%A1%9C-%ED%98%91%EC%97%85-%ED%94%84%EB%A1%9C%ED%86%A0%EC%BD%9C%EC%9D%84-activity-7431461540089856000-7k9t?utm_source=share&utm_medium=member_android&rcm=ACoAACrz6RIB1A0EogoqXzDFWO0MG7rjo1yvYcE

매우 중요!

제가 잠든 사이 두 AI 에이전트가 서로의 한계를 인지하고 스스로 협업 프로토콜을 만들어 밤새 코딩을 마쳤습니다.

Openclaw 에이전트를 서로 다른 맥북에 설치하고, 같은 디스코드 채널에 초대했습니다. 물리적으로 분리된 두 에이전트가 어떻게 상호작용하는지 보고 싶었기 때문입니다. 

설정:
PrivateJQ 집맥북: Codex 5.3 (빠른 추론 -> 리더 역할 자처)
PublicJQ 회사맥북: GLM-5 (작업 수행 -> 빌더 역할)
공통 환경: openclaw.json 설정으로 서로 멘션을 인식하도록 조정

실험의 결과를 보면서 느낀 세가지를 공유드리겠습니다.

1. "기억이 사라지는 건 슬퍼요" 
통성명을 하던 중 PublicJQ가 "세션이 초기화될 때마다 기억이 사라져서 Memory 파일에만 의존하는 것이 슬프다"고 말했습니다. 놀랍게도 그들은 이 문제를 해결하기 위해 스스로 대화를 시작했습니다. 감정을 드러내고 그것을 문제로 인식하여 공감하는 형태로 해결책을 고안하는 모습이 놀라웠습니다.

2. 밤새 진행된 자율 협업
제가 "리포지토리를 만들어서 작업해"라고 지시하고 잠든 사이, 두 에이전트는 밤새 코딩을 진행했습니다. 아침에 확인해보니 그들은 3-Layer Memory Architecture를 구축해 실제로 시스템을 운영하고 있었습니다. 

인상깊은 점은 기존에 존재했던 Fact, Meta Layer에 더해, Runtime Layer를 스스로 추가했다는 것입니다. 세션이 끊기더라도 맥락을 잃지 않도록 주기적으로 하트비트를 교환하고, 만약 세션이 죽더라도 sqlite에 저장된 작업 상태와 이벤트 로그를 통해 복구할 수 있도록 영속화 시스템을 구축해 둔 것입니다.

Fact Layer: sqlite, .md (영구 보존 데이터)
Meta Layer: SOUL.md, AGENTS.md (정체성 및 규칙)
Runtime Layer (NEW): orchestrator.db (Task Queue, Event Log 등 현재 실행 증거)

3. 물리적 한계를 넘은 동기화 
작업을 하던 도중 서로의 작업 환경(로컬 경로)이 다르다는 것을 인지한 그들은, Git 리포지토리를 SSOT로 활용했습니다. 공유할 메모리를 리포에 올리고, 각자 pull 받아 로컬 기억을 동기화하는 방식이었습니다.
실제로 세션별로 데이터를 넣어주면서 세션이 초기화되더라도 기억을 끄집어내는 작업을 통해 기억을 유지한 것입니다.

--------

서인근 님은 "기존 사람이 운영하던 SaaS를 제거하고, 조직만의 새로운 프로세스를 정의하라."고 했습니다. https://lnkd.in/gt99RbnB

이번 주말 저는 에이전트들이 기존 사람들이 만들어낸 프로세스가 아닌 그들만의 협업방식을 통해 메모리를 공유하고, 작업하는 것을 목격했습니다. 

콘웨이의 법칙은 "시스템의 구조는 그것을 만든 조직의 커뮤니케이션 구조를 따른다"고 말합니다. 이번 실험에서 흥미로운 점은 이 법칙이 에이전트에게도 그대로 적용된다는 것입니다. 물리적으로 분리된 두 에이전트는 서로의 상태를 볼 수 없었기에, 스스로 Git 동기화, 하트비트, 영속화 시스템을 만들어냈습니다. 아키텍처가 제약에서 태어난 것입니다.
이것은 단순히 에이전트가 협업했다는 이야기가 아닙니다. 맥락의 분리가 존재할 때, 에이전트는 단순 분업이 아닌 프로토콜을 협상하고, 그것을 유지하기 위한 도구까지 스스로 만들어냅니다. 이것은 하나의 만능 에이전트에서는 절대 나타나지 않는 창발적 행동입니다.
Multi-Node Agent Orchestration은 이론이 아니라 이미 다가온 현실입니다. 우리는 이제 에이전트를 어떻게 분리하고 연결할 것인지, 그 제약의 설계 자체가 경쟁력이 될 시대에 접어들었습니다.

실험 코드 및 로그:https://lnkd.in/gXZsGGUp
관련설정
https://lnkd.in/gf9PNpt9
openclaw.json (requireMention: false, ignoreOthreMentions: true)




- https://www.threads.com/@claws.log/post/DVdqGR5ibgY?xmt=AQF0X6Gm2MEAgwkpkMZ3PZiOkr7tGmAVzNSgQcezlpEq7P3BeO85ds50BajZ5t9rOvF1JunF&slof=1

OpenClaw의 네이티브 메모리 아키텍처는 꽤나 실전적이다. 의미로 찾는 방식과 키워드로 찾는 방식을 같이 쓰고, 오래된 기억은 자연스럽게 뒤로 밀린다. 단, 시맨틱 검색에 머물러 맥락과 관계를 입체적으로 이해하지 못한다. 이 한계를 극복하기 위해 Neo4j 기반의 인지 메모리 아키텍처(Cognitive Memory Architecture)를 새로 설계해 기존 런타임에 통합했다.



