import React from "react";
import {
  format
} from 'date-fns'

import { DataContext } from "../context/data";
import { capitalise } from "../util/text";
import Button from "./Button";

export const nform = new Intl.NumberFormat();

export function From () {
  const {meta } = React.useContext(DataContext);

  return format(new Date(meta.start), 'yyyy-MM-dd'); 
}
export function To () {
  const {meta } = React.useContext(DataContext);

  return format(new Date(meta.end), 'yyyy-MM-dd'); 
}

export function SampleSize () {
  const {meta } = React.useContext(DataContext);

  return nform.format(meta.sumCount);
}

export function Periodically () {
  const { groupBy } = React.useContext(DataContext);

  return capitalise(groupBy);
}

export function ShowCombined () {
  const { groupBy } = React.useContext(DataContext);

  return capitalise(groupBy);
}
