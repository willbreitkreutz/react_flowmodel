# Simple flow model

Need more documentation...

clone the repo, run `npm install` then run `npm start` to run.

requires that you have NPM and Node.js (they come together with the Node installer)

## The model

Don't worry about most of the app, you care about what's in the `src/components/model.js` file.

Assuming that basal_drag = driving_stress all motion / flux is due to internal deformation

driving_stress = rho _ g _ thickness \* sin(alpha) where alpha is the gradient of the surface

when driving_stress > basal drag, we get basal sliding in some form or fashion
