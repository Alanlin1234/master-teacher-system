import asyncio
from app.database import init_db, AsyncSessionLocal
from app.services.db_service import UserService, TeacherService

async def main():
    await init_db()
    async with AsyncSessionLocal() as session:
        await UserService.ensure_default_users(session)
        await TeacherService.seed_teachers(session)
        teachers = await TeacherService.list_all(session)
        print(f"SUCCESS: Seeded {len(teachers)} teachers into SQLite database!")
        for t in teachers[:3]:
            print(f" - [{t.id}] {t.name} ({t.subject}) | 5D Style: {t.style}")

if __name__ == "__main__":
    asyncio.run(main())
