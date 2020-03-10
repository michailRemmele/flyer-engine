import Processor from 'engine/processor/processor';

const COLLISION_ENTER_MSG = 'COLLISION_ENTER';
const COLLISION_STAY_MSG = 'COLLISION_STAY';
const ADD_EFFECT_MSG = 'ADD_EFFECT';

const RIGID_BODY_COMPONENT_NAME = 'rigidBody';
const RENDERABLE_COMPONENT_NAME = 'renderable';

const SPACE_SORTING_LAYER = 'space';

const FALL_EFFECT = {
  name: 'fall',
  effect: 'damage',
  effectType: 'periodical',
  applicatorOptions: {
    frequency: 200,
  },
  effectOptions: {
    value: 25,
  },
};
const FETTER_EFFECT = {
  name: 'fallFetter',
  effect: 'fetter',
  effectType: 'continuous',
};

class FallProcessor extends Processor {
  constructor(options) {
    super();

    this._gameObjectObserver = options.gameObjectObserver;
    this._fallingGameObjectsMap = {};
    this._fallingGameObjects = [];
  }

  _processRemovedGameObjects() {
    this._gameObjectObserver.getLastRemoved().forEach((gameObject) => {
      const gameObjectId = gameObject.getId();

      if (this._fallingGameObjectsMap[gameObjectId]) {
        this._fallingGameObjects = this._fallingGameObjects.filter((gameObject) => {
          return gameObject.getId() !== gameObjectId;
        });
      }

      this._fallingGameObjectsMap[gameObjectId] = null;
    });
  }

  _isFalling(gameObject, messageBus) {
    const enterMessages = messageBus.getById(COLLISION_ENTER_MSG, gameObject.getId()) || [];
    const stayMessages = messageBus.getById(COLLISION_STAY_MSG, gameObject.getId()) || [];

    return ![ enterMessages, stayMessages ].some((messages) => {
      return messages.some((message) => {
        const { otherGameObject } = message;
        const rigidBody = otherGameObject.getComponent(RIGID_BODY_COMPONENT_NAME);

        return rigidBody && !rigidBody.ghost;
      });
    });
  }

  process(options) {
    const messageBus = options.messageBus;

    this._processRemovedGameObjects();

    this._fallingGameObjects = this._fallingGameObjects.filter((gameObject) => {
      const collisionMessages = messageBus.getById(COLLISION_ENTER_MSG, gameObject.getId()) || [];
      return collisionMessages.every((message) => {
        const { otherGameObject } = message;
        const rigidBody = otherGameObject.getComponent(RIGID_BODY_COMPONENT_NAME);

        if (rigidBody) {
          const renderable = gameObject.getComponent(RENDERABLE_COMPONENT_NAME);
          renderable.sortingLayer = SPACE_SORTING_LAYER;
          return false;
        }
        return true;
      });
    });

    this._gameObjectObserver.forEach((gameObject) => {
      const gameObjectId = gameObject.getId();
      const rigidBody = gameObject.getComponent(RIGID_BODY_COMPONENT_NAME);

      if (!this._fallingGameObjectsMap[gameObjectId] && this._isFalling(gameObject, messageBus)) {
        rigidBody.ghost = true;

        messageBus.send({
          type: ADD_EFFECT_MSG,
          id: gameObject.getId(),
          gameObject,
          ...FALL_EFFECT,
        });
        messageBus.send({
          type: ADD_EFFECT_MSG,
          id: gameObject.getId(),
          gameObject,
          ...FETTER_EFFECT,
        });

        this._fallingGameObjectsMap[gameObjectId] = true;
        this._fallingGameObjects.push(gameObject);
      }
    });
  }
}

export default FallProcessor;
