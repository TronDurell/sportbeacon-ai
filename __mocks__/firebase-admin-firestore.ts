export const getFirestore = jest.fn(() => ({
  collection: jest.fn(() => ({
    doc: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [], empty: true }),
    add: jest.fn()
  })),
  doc: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    collection: jest.fn()
  })),
  set: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
  runTransaction: jest.fn(async fn => fn({ 
    get: jest.fn(), 
    set: jest.fn(), 
    update: jest.fn() 
  })),
  batch: jest.fn(() => ({
    set: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    commit: jest.fn().mockResolvedValue(undefined)
  }))
}));