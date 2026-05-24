require('dotenv').config()
const { User } = require('../models')
const bcrypt = require('bcryptjs')

const [,, username, email, password, roleInput] = process.argv

async function run() {
  if (!username || !email || !password) {
    console.log('\nUsage: node scripts/createUser.js <username> <email> <password> [role]')
    process.exit(1)
  }

  const role = roleInput || 'author'

  try {
    const existing = await User.findOne({ where: { email } })
    if (existing) {
      console.error(`Error: User "${email}" already exists.`)
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const newUser = await User.create({
      username, email, password: hashedPassword, role,
      isActive: true, isVerified: true,
      permissions: {
        canPublish: true, canEdit: true,
        canDelete: ['admin','super_admin'].includes(role),
        canManageUsers: ['admin','super_admin'].includes(role),
        canManageSettings: ['admin','super_admin'].includes(role),
        canManageCategories: true, canManageMedia: true, canViewAnalytics: true,
      }
    })

    console.log('\n✅ User created!')
    console.log(`Username: ${newUser.username} | Email: ${newUser.email} | Role: ${newUser.role}\n`)
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    process.exit(0)
  }
}

run()
