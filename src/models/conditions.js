import db from '../utils/db'

export async function getConditions (callback) {
  const snapshot = await db.collection('conditions').get()

  if (snapshot.empty) return []
  snapshot.forEach((condition) => {
    callback(condition.data())
  })
}
