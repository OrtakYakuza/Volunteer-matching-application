import { PrismaClient } from '@prisma/client'
import { Skill, Priority, TaskStatus, AutomationMode, AssignmentStatus } from '../lib/enums'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await prisma.eventLog.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.volunteer.deleteMany()

  console.log('Creating Volunteers...')
  const volunteers = []
  const names = ['Alice Smith', 'Bob Jones', 'Charlie Davis', 'Diana Prince', 'Eve Adams', 'Frank Castle', 'Grace Lee', 'Hank Pym', 'Ivy Chen', 'Jack Ryan', 'Karen Page', 'Leo Fitz', 'Mia Wong']
  
  for (let i = 0; i < names.length; i++) {
    const v = await prisma.volunteer.create({
      data: {
        name: names[i],
        email: `${names[i].toLowerCase().replace(' ', '.')}@example.com`,
        phoneNumber: `555-010${i}`,
        birthDate: new Date(1990 + (i % 10), i % 12, (i % 28) + 1),
        postalCode: '1000' + (i % 5 + 1), // distributes postal codes
        location: 'City Area',
        skills: JSON.stringify(i % 3 === 0 ? [Skill.HEAVY_PHYSICAL] : i % 3 === 1 ? [Skill.MEDICAL, Skill.TRANSLATION] : [Skill.ADMINISTRATION]),
      }
    })
    volunteers.push(v)
  }

  console.log('Creating Tasks...')
  const tasks = []
  
  // MANUAL Tasks (High Risk)
  tasks.push(await prisma.task.create({
    data: {
      title: 'Pro Bono Legal Counsel', category: 'Legal', description: 'Provide legal advice to displaced individuals. High risk, requires careful vetting.',
      location: 'City Hall', postalCode: '10001', requiredSkills: JSON.stringify([Skill.ADMINISTRATION]), capacity: 2,
      startTime: new Date(new Date().setHours(9, 0, 0, 0)), endTime: new Date(new Date().setHours(12, 0, 0, 0)),
      priority: Priority.HIGH, status: TaskStatus.OPEN, automationMode: AutomationMode.MANUAL,
    },
  }))
  tasks.push(await prisma.task.create({
    data: {
      title: 'Crisis Psychological Support', category: 'Medical', description: 'Counseling for severe trauma victims.',
      location: 'Shelter A', postalCode: '10002', requiredSkills: JSON.stringify([Skill.MEDICAL]), capacity: 3,
      startTime: new Date(new Date().setHours(10, 0, 0, 0)), endTime: new Date(new Date().setHours(15, 0, 0, 0)),
      priority: Priority.CRITICAL, status: TaskStatus.OPEN, automationMode: AutomationMode.MANUAL,
    },
  }))
  tasks.push(await prisma.task.create({
    data: {
      title: 'Childcare Coordinator', category: 'Childcare', description: 'Oversee the temporary daycare. High risk, background check needed.',
      location: 'Community Center', postalCode: '10003', requiredSkills: JSON.stringify([Skill.CHILDCARE]), capacity: 2,
      startTime: new Date(new Date().setHours(8, 0, 0, 0)), endTime: new Date(new Date().setHours(18, 0, 0, 0)),
      priority: Priority.HIGH, status: TaskStatus.OPEN, automationMode: AutomationMode.MANUAL,
    },
  }))

  // SEMI-AUTO Tasks (Medium Risk)
  tasks.push(await prisma.task.create({
    data: {
      title: 'Medical Triage Translation', category: 'Translation', description: 'Assist medical staff with translation.',
      location: 'City Hospital', postalCode: '10002', requiredSkills: JSON.stringify([Skill.MEDICAL, Skill.TRANSLATION]), capacity: 3,
      startTime: new Date(new Date().setHours(14, 0, 0, 0)), endTime: new Date(new Date().setHours(18, 0, 0, 0)),
      priority: Priority.CRITICAL, status: TaskStatus.OPEN, automationMode: AutomationMode.SEMI_AUTO,
    },
  }))
  tasks.push(await prisma.task.create({
    data: {
      title: 'Logistics Database Setup', category: 'Administration', description: 'Help organize the supply chain database.',
      location: 'HQ', postalCode: '10001', requiredSkills: JSON.stringify([Skill.ADMINISTRATION, Skill.INFORMATION_RETRIEVAL]), capacity: 4,
      startTime: new Date(new Date().setHours(9, 0, 0, 0)), endTime: new Date(new Date().setHours(17, 0, 0, 0)),
      priority: Priority.MEDIUM, status: TaskStatus.OPEN, automationMode: AutomationMode.SEMI_AUTO,
    },
  }))
  tasks.push(await prisma.task.create({
    data: {
      title: 'Information Desk Interpreter', category: 'Translation', description: 'Answer questions at the main shelter desk in multiple languages.',
      location: 'Main Shelter', postalCode: '10004', requiredSkills: JSON.stringify([Skill.TRANSLATION]), capacity: 2,
      startTime: new Date(new Date().setHours(8, 0, 0, 0)), endTime: new Date(new Date().setHours(12, 0, 0, 0)),
      priority: Priority.LOW, status: TaskStatus.OPEN, automationMode: AutomationMode.SEMI_AUTO,
    },
  }))

  // AUTO Tasks (Low Risk)
  tasks.push(await prisma.task.create({
    data: {
      title: 'Handing out food & water', category: 'Physical Labor', description: 'Distribute supplies at the central plaza.',
      location: 'Central Plaza', postalCode: '10001', requiredSkills: JSON.stringify([Skill.LIGHT_PHYSICAL]), capacity: 15,
      startTime: new Date(new Date().setHours(10, 0, 0, 0)), endTime: new Date(new Date().setHours(16, 0, 0, 0)),
      priority: Priority.MEDIUM, status: TaskStatus.OPEN, automationMode: AutomationMode.AUTO,
    },
  }))
  tasks.push(await prisma.task.create({
    data: {
      title: 'Sandbag Loading', category: 'Physical Labor', description: 'Load sandbags onto trucks.',
      location: 'Depot', postalCode: '10005', requiredSkills: JSON.stringify([Skill.HEAVY_PHYSICAL]), capacity: 20,
      startTime: new Date(new Date().setHours(7, 0, 0, 0)), endTime: new Date(new Date().setHours(19, 0, 0, 0)),
      priority: Priority.HIGH, status: TaskStatus.OPEN, automationMode: AutomationMode.AUTO,
    },
  }))
  tasks.push(await prisma.task.create({
    data: {
      title: 'Street Cleanup Crew', category: 'Physical Labor', description: 'Clear debris from main roads.',
      location: 'Downtown', postalCode: '10001', requiredSkills: JSON.stringify([Skill.MEDIUM_PHYSICAL]), capacity: 25,
      startTime: new Date(new Date().setHours(8, 0, 0, 0)), endTime: new Date(new Date().setHours(14, 0, 0, 0)),
      priority: Priority.MEDIUM, status: TaskStatus.OPEN, automationMode: AutomationMode.AUTO,
    },
  }))
  tasks.push(await prisma.task.create({
    data: {
      title: 'Donation Sorting', category: 'Physical Labor', description: 'Sort incoming clothes and canned goods.',
      location: 'Warehouse', postalCode: '10003', requiredSkills: JSON.stringify([Skill.LIGHT_PHYSICAL]), capacity: 10,
      startTime: new Date(new Date().setHours(9, 0, 0, 0)), endTime: new Date(new Date().setHours(17, 0, 0, 0)),
      priority: Priority.LOW, status: TaskStatus.OPEN, automationMode: AutomationMode.AUTO,
    },
  }))

  console.log('Creating some initial assignments (applications)...')
  
  // Distribute volunteers to tasks to simulate realistic load
  // Task 0 (Manual) - 3 applicants
  for (let i=0; i<3; i++) {
    await prisma.assignment.create({ data: { volunteerId: volunteers[i].id, taskId: tasks[0].id, status: AssignmentStatus.PROPOSED }})
  }
  // Task 3 (Semi-Auto) - 4 applicants
  for (let i=3; i<7; i++) {
    await prisma.assignment.create({ data: { volunteerId: volunteers[i].id, taskId: tasks[3].id, status: AssignmentStatus.PROPOSED }})
  }
  // Task 6 (Auto) - 5 applicants
  for (let i=7; i<12; i++) {
    await prisma.assignment.create({ data: { volunteerId: volunteers[i].id, taskId: tasks[6].id, status: AssignmentStatus.PROPOSED }})
  }

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
