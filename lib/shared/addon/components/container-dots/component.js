import { computed, observer } from '@ember/object';
import { sort, alias } from '@ember/object/computed';
import Component from '@ember/component';
import pagedArray from 'ember-cli-pagination/computed/paged-array';
import { matches } from 'shared/components/sortable-table/component';
import layout from './template';

export const searchFields = ['displayName','id:prefix','displayState','image','displayIp:ip'];

export default Component.extend({
  layout,
  containers: null,
  searchText: null,
  groupByPod: false,
  paging: true,
  sort: ['sortByDeploymentUnitName','id'],
  searchFields: searchFields,

  tagName: '',

  page: 1,
  perPage: 120, // Ignore the setting because these are tiny dots.
  // 120 because it has lots of prime factors so that almost any sidekick combination
  // can be shown without a deploymentUnit being broken up into 2 pages.

  // -----
  // Flow: containers -> arranged -> filtered -> pagedContent -> grouped
  // -----
  arranged: sort('containers','sort'),
  filtered: computed('arranged.[]','searchText', function() {
    let out = this.get('arranged').slice();
    let searchFields = this.get('searchFields');
    let searchText = (this.get('searchText')||'').trim().toLowerCase();

    if ( searchText.length ) {
      let searchTokens = searchText.split(/\s*[, ]\s*/);

      for ( let i = out.length-1 ; i >= 0 ; i-- ) {
        let row = out[i];
        for ( let j = 0 ; j < searchTokens.length ; j++ ) {
          let expect = true;
          let token = searchTokens[j];

          if ( token.substr(0,1) === '!' ) {
            expect = false;
            token = token.substr(1);
          }

          if ( token && matches(searchFields, token, row) !== expect ) {
            out.removeAt(i);
            break;
          }
        }
      }
    }

    return out;
  }),

  pagedContent: pagedArray('filtered', {
    page: alias("parent.page"),
    perPage: alias("parent.perPage")
  }),

  grouped: computed('pagedContent.[].deploymentUnitUuid', function() {
    let map = {};
    this.get('pagedContent').forEach((inst) => {
      let du = inst.get('deploymentUnitUuid');
      let ary = map[du];
      if ( !ary ) {
        ary = [];
        map[du] = ary;
      }

      ary.push(inst);
    });

    return Object.values(map);
  }),

  indexFrom: computed('page','perPage', function() {
    var current =  this.get('page');
    var perPage =  this.get('perPage');
    return Math.max(0, 1 + perPage*(current-1));
  }),

  indexTo: computed('indexFrom','perPage','filtered.length', function() {
    return Math.min(this.get('filtered.length'), this.get('indexFrom') + this.get('perPage') - 1);
  }),

  pageCountChanged: observer('indexFrom', 'filtered.length', function() {
    // Go to the last page if we end up past the last page
    let from = this.get('indexFrom');
    let last = this.get('filtered.length');
    var perPage = this.get('perPage');

    if ( this.get('page') > 1 && from > last) {
      let page = Math.ceil(last/perPage);
      this.set('page', page);
    }
  }),
});
