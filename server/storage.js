export class MemStorage {
  constructor() {
    this.jobs = new Map();
    this.currentJobId = 1;
  }

  async createJob(insertJob) {
    const id = this.currentJobId++;
    const job = {
      ...insertJob,
      id,
      status: "pending",
      outputPath: null,
      error: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.jobs.set(id, job);
    return job;
  }

  async getJob(id) {
    return this.jobs.get(id);
  }

  async updateJobStatus(id, status, outputPath, error) {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob = {
      ...job,
      status,
      outputPath: outputPath || job.outputPath,
      error: error || job.error,
      completedAt: status === "completed" || status === "failed" ? new Date() : job.completedAt,
    };

    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  // Keep existing user methods for compatibility
  async getUser(id) {
    return undefined;
  }

  async getUserByUsername(username) {
    return undefined;
  }

  async createUser(user) {
    return user;
  }
}

export const storage = new MemStorage();