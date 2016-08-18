/**
 * Created by kelly on 16/08/2016.
 */


var TITLE = "cellar";
process.env.component = TITLE;
if (!process.env.conf_file) {
  process.env.conf_file = process.argv[2];
}


// args and usage
function usage() {
  /* eslint-disable no-console */
  console.log("Usage: " + args.$0 + " <config file> [-d] (debug) --master-only --workers=[int] \n --master-only will override  --workers so should not be used together");
  /* eslint-enable no-console */
  process.exit(0);
}

if (args.h) {
  usage();
}

if (args._.length < 1) {
  usage();
}
