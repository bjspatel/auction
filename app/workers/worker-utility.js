var workerUtil = {};

workerUtil.generateDefaultItemData = function(playerId) {
  return [
    {
      'name': 'bread',
      'player_id': playerId,
      'quantity': 30
    },
    {
      'name': 'carrot',
      'player_id': playerId,
      'quantity': 18
    },
    {
      'name': 'diamond',
      'player_id': playerId,
      'quantity': 1
    }
  ];
};

workerUtil.generateResponse = function(processedData) {
  console.log('PROCESSED DATA');
  console.log(processedData);

  return processedData;
};

module.exports = workerUtil;
