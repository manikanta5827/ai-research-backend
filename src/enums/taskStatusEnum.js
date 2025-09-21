

const taskStatus = Object.freeze({
    PENDING: "pending",
    RUNNING: "running",
    SUCCEEDED: "succeeded",
    FAILED: "failed"
})

const isValidTaskStatus = (status) => {
    return Object.values(taskStatus).includes(status);
}

module.exports = { taskStatus, isValidTaskStatus };