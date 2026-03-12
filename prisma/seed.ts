import { PrismaClient } from '@prisma/client'
import { Skill, Priority, TaskStatus, AutomationMode, AssignmentStatus } from '../lib/enums'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean up existing data to prevent duplicates
  await prisma.eventLog.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.availability.deleteMany()
  await prisma.task.deleteMany()
  await prisma.volunteer.deleteMany()

  console.log('Creating Volunteers...')
  const alice = await prisma.volunteer.create({
    data: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      postalCode: '10001',
      location: 'Downtown',
      skills: JSON.stringify([Skill.HEAVY_PHYSICAL, Skill.MEDIUM_PHYSICAL]),
      availabilityBlocks: {
        create: [
          {
            start: new Date(new Date().setHours(8, 0, 0, 0)),
            end: new Date(new Date().setHours(12, 0, 0, 0)),
            note: 'Morning shift only',
          },
        ],
      },
    },
  })

  const bob = await prisma.volunteer.create({
    data: {
      name: 'Bob Jones',
      email: 'bob@example.com',
      postalCode: '10002',
      location: 'Westside',
      skills: JSON.stringify([Skill.MEDICAL, Skill.TRANSLATION]),
      availabilityBlocks: {
        create: [
          {
            start: new Date(new Date().setHours(13, 0, 0, 0)),
            end: new Date(new Date().setHours(17, 0, 0, 0)),
          },
        ],
      },
    },
  })

  const charlie = await prisma.volunteer.create({
    data: {
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      postalCode: '10001',
      location: 'Downtown',
      skills: JSON.stringify([Skill.INFORMATION_RETRIEVAL, Skill.ADMINISTRATION]),
      availabilityBlocks: {
        create: [
          {
            start: new Date(new Date().setHours(9, 0, 0, 0)),
            end: new Date(new Date().setHours(18, 0, 0, 0)),
            note: 'Available all day',
          },
        ],
      },
    },
  })

  console.log('Creating Tasks...')
  const task1 = await prisma.task.create({
    data: {
      title: 'Sandbag Loading',
      category: 'Physical Labor',
      description: 'Loading sandbags onto trucks at the main depot.',
      location: 'Main Depot',
      postalCode: '10001',
      requiredSkills: JSON.stringify([Skill.HEAVY_PHYSICAL]),
      capacity: 5,
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(12, 0, 0, 0)),
      priority: Priority.HIGH,
      status: TaskStatus.OPEN,
      automationMode: AutomationMode.MANUAL,
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Medical Triage Translation',
      category: 'Medical/Translation',
      description: 'Assist medical staff with Spanish translation at the triage center.',
      location: 'City Hospital',
      postalCode: '10002',
      requiredSkills: JSON.stringify([Skill.MEDICAL, Skill.TRANSLATION]),
      capacity: 2,
      startTime: new Date(new Date().setHours(14, 0, 0, 0)),
      endTime: new Date(new Date().setHours(18, 0, 0, 0)),
      priority: Priority.CRITICAL,
      status: TaskStatus.OPEN,
      automationMode: AutomationMode.SEMI_AUTO,
    },
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'Data Entry',
      category: 'Administration',
      description: 'Entering volunteer registration forms into the backup system.',
      location: 'HQ',
      postalCode: '10001',
      requiredSkills: JSON.stringify([Skill.ADMINISTRATION]),
      capacity: 10,
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(16, 0, 0, 0)),
      priority: Priority.LOW,
      status: TaskStatus.OPEN,
      automationMode: AutomationMode.AUTO,
    },
  })

  console.log('Creating some initial assignments (applications)...')
  
  // Alice applies for Sandbag Loading
  await prisma.assignment.create({
    data: {
      volunteerId: alice.id,
      taskId: task1.id,
      status: AssignmentStatus.PROPOSED,
    },
  })

  // Bob applies for Translation
  await prisma.assignment.create({
    data: {
      volunteerId: bob.id,
      taskId: task2.id,
      status: AssignmentStatus.PROPOSED,
    },
  })

  console.log('Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
