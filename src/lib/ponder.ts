const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069'

export async function ponderQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
  try {
    const response = await fetch(PONDER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ponder query failed: ${response.statusText}`)
    }

    const json = await response.json()
    if (json.errors) {
      throw new Error(`Ponder GraphQL errors: ${JSON.stringify(json.errors)}`)
    }

    return json.data
  } catch (error) {
    console.error('Ponder query error:', error)
    throw error
  }
}
