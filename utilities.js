/**
 * Constant for start command
 */
const commands = [
    {
        name: 'start',
        description: 'Start the bot',
    }
];

/**
 * Questions that the manager has to answer to calculate the level of social debt. For every question, we have:
 *      Content: the question that will be showed to the manager
 *      Weight: the weight of the answer to that question for the final result
 *      Smell: the acronym of the smell
 */
const questions = [
    /** Lone Wolf questions */
    {
        content: "The contributor has insufficient communication with the team",
        weight: 3.773802,
        smell: "LW"
    },
    {
        content: "The contributor does not take into account the activities of other team members",
        weight: 4.571365,
        smell: "LW"
    },

    /** Prima Donna questions */
    {
        content: "The contributor has an unwillingness to accept help or support from peers",
        weight: 4.701781,
        smell: "PD"
    },
    {
        content: "The contributor refuses to listen to the ideas or opinions of peers",
        weight: 4.426934,
        smell: "PD"
    },
    /** Black Cloud questions */
    {
        content: "The contributor hoard critical knowledge and not share it",
        weight: 3.576237,
        smell: "BC"
    },
    {
        content: "The contributor does not communicate effectively with other peers",
        weight: 4.033143,
        smell: "BC"
    }
]

/** Constants for the acronym of the social debt in exam */
const smellsNames = {
    "LW": "Lone Wolf",
    "PD": "Prima Donna",
    "BC": "Black Cloud"
}

/** Constants for the possible answers to the question and the associated value to calculate the final result */
const gamma = {
    "strDis": {value: 0},
    "dis": {value: 0},
    "neutral": {value: 0},
    "agree": {value: 0.5},
    "strAgree": {value: 1}
};

module.exports.commands = commands;
module.exports.questions = questions;
module.exports.gamma = gamma;
module.exports.smellsNames = smellsNames;
