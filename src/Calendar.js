import React from 'react';
import _ from 'lodash';
import moment from 'moment';

import './Calendar.css';

export default class Calendar extends React.Component {
  constructor(props) {
    super(props);
    this.today = moment.utc().startOf('day');
    this.todayLabel = this.today.format('D MMM');
    this.firstMonday = moment.utc().startOf('year').startOf('isoweek');
    this.endOfYear = moment.utc().endOf('year');
  }

  render() {
    return (
      <div className="Calendar">
        <h2 className="title">{ this.props.title }</h2>
        <h3 className="description">{ this.props.goalDescription }</h3>
        { this.renderContent() }
      </div>
    );
  }

  renderContent() {
    const rows = _.chunk(this.getDays(), 21).map((data, i) => {
      return (
        <tr key={ i }>{ data }</tr>
      );
    })
    return (
      <table>
        <tbody>
          { rows }
        </tbody>
      </table>
    );
  }

  getDays() {
    const entriesByDate = _.keyBy(this.props.entries, '_date');
    const mostRecent = [];
    const scoreFn = this.getScoreFn();
    return _.range(this.endOfYear.diff(this.firstMonday, 'days') + 1).map((i) => {
      const day = this.firstMonday.clone().add(i, 'days');
      const dayLabel = day.format('D MMM');
      if (day.year() !== this.endOfYear.year()) {
        return (
          <td key={ dayLabel } />
        );
      }

      if (day.isAfter(this.today)) {
        return (
          <td
            key={ dayLabel }
            title={ dayLabel }
          >
            <span />
          </td>
        );
      }

      mostRecent.push(!!(entriesByDate[dayLabel] && entriesByDate[dayLabel][this.props.title]));
      if (mostRecent.legnth > 7) {
        mostRecent.shift();
      }
      const score = scoreFn(mostRecent);
      const label = `${dayLabel} — ${score}%`;

      return (
        <td
          key={ dayLabel }
          title={ label }
          className={ this.getContainerClassName(dayLabel) }
        >
          <span
            className={ this.getClassName(_.last(mostRecent), score) }
          >
          </span>
        </td>
      );
    });
  }

  getScoreFn() {
    const groups = /(<=|>=)([0-9]+)\/([0-9]+)/.exec(this.props.goal);
    const leOrGe = groups[1];
    const num = parseInt(groups[2], 10);
    const den = parseInt(groups[3], 10);
    let goal;
    if (leOrGe === '>=') {
      goal = num/den;
    } else {
      goal = (den - num)/den;
    }
    console.log({ leOrGe, num, den, goal });

    return mostRecent => {
      let last = _.takeRight(mostRecent, den);
      if (last.length < den) {
        last = last.concat(_.times(den - last.length, _.constant(leOrGe !== '>=')));
      }
      console.log(last);
      let score;
      if (leOrGe === '>=') {
        score = _.sum(last) / den;
      } else {
        score = (den - _.sum(last)) / den;
      }
      console.log({ last, score });
      return Math.min(100, parseInt(score * 100 / goal, 10));
    };
  }

  getContainerClassName(label) {
    return this.todayLabel === label ? 'today' : undefined;
  }

  getClassName(done, score) {
    let classes = '';
    if (done) {
      classes = `${classes} done`;
    }
    if (score < 25) {
      classes = `${classes} goal-0`;
    } else if (score < 50) {
      classes = `${classes} goal-25`;
    } else if (score < 75) {
      classes = `${classes} goal-50`;
    } else if (score < 100) {
      classes = `${classes} goal-75`;
    } else {
      classes = `${classes} goal-100`;
    }
    return classes;
  }

  static propTypes = {
    title: React.PropTypes.string.isRequired,
    goal: React.PropTypes.string.isRequired,
    goalDescription: React.PropTypes.string.isRequired,
    entries: React.PropTypes.array.isRequired,
  };
}