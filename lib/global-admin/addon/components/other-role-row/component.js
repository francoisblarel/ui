import Component from '@ember/component';
import layout from './template';

export default Component.extend({
  layout,
  model: null,
  otherRoles: null,
  choices: null,

  tagName: 'TR',
  classNames: 'main-row',

  actions: {
    remove: function () {
      this.sendAction('remove', this.get('model'));
    }
  },

  init: function () {
    this._super(...arguments);
    const otherRoles = this.get('otherRoles');
    this.set('choices', otherRoles.map(role => {
      return {
        label: role.name,
        value: role.id,
      };
    }));
  },
});
