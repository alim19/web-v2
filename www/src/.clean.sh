#!/bin/bash
filenames=`find -type f -name '*.ts'`;
rm -f ${filenames//'.ts'/'.js*'}