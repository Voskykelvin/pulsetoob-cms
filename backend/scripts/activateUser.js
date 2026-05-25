require('dotenv').config()
const { User } = require('../models')

const [,, email] = process.argv

async function run() {
  const user = await User.findOne({ where: { email } })
  if (!user) { console.error('User not found'); process.exit(1) }
  
  await user.update({ 
    isActive: true, 
    isVerified: true,
    role: 'super_admin',
    permissions: {
      canPublish: true,
      canEdit: true,
      canDelete: true,
      canManageUsers: true,
      canManageSettings: true,
      canManageCategories: true,
      canManageMedia: true,
      canViewAnalytics: true,
    }
  })
  
  console.log(`User ${email} is now active as super_admin!`)
  process.exit(0)
}

run()
