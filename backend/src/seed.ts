import { prisma } from "./lib/prisma";

async function main() {
  const count = await prisma.student.count();
  if (count > 0) {
    console.log("이미 데이터가 있어 seed를 건너뜁니다.");
    return;
  }

  await prisma.student.createMany({
    data: [
      { name: "김민준", guardianPhone: "010-1111-2222", courseName: "중등 수학", monthlyFee: 250000 },
      { name: "이서연", guardianPhone: "010-3333-4444", courseName: "고등 영어", monthlyFee: 300000 },
      { name: "박도윤", guardianPhone: "010-5555-6666", courseName: "초등 논술", monthlyFee: 180000 },
    ],
  });

  console.log("샘플 원생 3명 생성 완료");
}

main().finally(() => prisma.$disconnect());
