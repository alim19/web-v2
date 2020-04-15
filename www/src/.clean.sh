#!/bin/bash
filenames=`ls *.ts **/*.ts`;rm -f ${filenames//'.ts'/'.js*'}