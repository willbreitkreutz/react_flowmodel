# from numba import jit
from math import fabs
import json
import time

# constants
dt = 1 / 200  # chosen to make it run a bit faster than one day at a time
iterations = 1000000  # number of iterations to run

# dx = 500.0  ### LETS DERIVE THIS INSTEAD OF DECLARING IT
L = 100.0  # Model length in kilometers
gridpoints = 200  # Number of gridpoints we want to calculate
dx = L / gridpoints * 1000  # distance between gridpoints in meters

# Flow law stuff
A = 3e-16  # could be as small as -24, Pa/
rho = 917  # density of ice, KG/M^3 (need kg since our A is Pa, which has Newtons, which is kg)
g = 9.81  # gravity
n = 3.0
Afl = ((2 * A) / (n + 2)) * (rho * g) ** n
print(A, Afl)

# I'm using longer variable names from here on in to make them easier to read
# create a list to hold our ice elevation of a length based on the number of gridpoints
ice_elevation = [0] * gridpoints

# create a list of bed elevations the same size of our ice_elevation list, set to 0 for now
bed_elevation = [0] * gridpoints

# create a list of midpoints which will hold the flux that we calculate
midpoint_flux = [0] * (gridpoints - 1)


# surface mass balance
# an equation for the surface that drops into the negatives
def getMassBalance(i):
    precip = 2 - (i / (0.4 * gridpoints)) ** 3
    return precip


def calculateFlux():
    # loop through our midpoints by index value, 0 -> gridpoints - 1
    for i in range(gridpoints - 1):
        # get our elevation data based on our current index value
        upstream_ice_elevation = ice_elevation[i]
        downstream_ice_elevation = ice_elevation[i + 1]
        upstream_bed_elevation = bed_elevation[i]
        downstream_bed_elevation = bed_elevation[i + 1]

        # calculate our thickness values
        upstream_thickness = upstream_ice_elevation - upstream_bed_elevation
        downstream_thickness = downstream_ice_elevation - downstream_bed_elevation

        # calculate big H, our average thickness at this midpoint
        H = (upstream_thickness + downstream_thickness) / 2

        # calculate our slope, change in elevation over change in distance
        slope = (downstream_ice_elevation - upstream_ice_elevation) / dx

        # calculate diffusivity from these terms
        D = Afl * H ** (n + 2) * fabs(slope) ** (n - 1)

        # calculate flux
        flux = (
            D * slope
        )  # going to be a negative value since our slope is sloping downstream

        # set our midpoint flux at this index to our newly calculated value
        midpoint_flux[i] = flux


def calculateThickness():
    for i in range(gridpoints):
        # grab our current values based on this index
        current_ice_elevation = ice_elevation[i]
        current_bed_elevation = bed_elevation[i]

        # get the upstream flux from our flux array
        #
        # so, if
        # flux = [0, 1, 2, 3, 4, ..., 123]
        # iceE = [0, 1, 2, 3, 4, ..., 123, 124]
        #
        # upstream flux = flux element at i - 1
        # downstream flux = flux element at i
        #

        # assume the first element case
        current_upstream_flux = 0

        # if we're not at the first element than we can pick upstream flux
        if i > 0:
            current_upstream_flux = midpoint_flux[i - 1]

        # for downstream, we need to make sure we're not at the last element
        # otherwise we set it to the same value as the upstream element so that
        # any flux is passthrough... shouldn't ever need that if our mass balance is right
        # and no ice ever gets to the end
        if i < gridpoints - 1:
            current_downstream_flux = midpoint_flux[i]
        else:
            current_downstream_flux = current_upstream_flux

        # get our mass balance flux
        mass_balance_flux = getMassBalance(i)

        # calculate change in thickness, remember our fluxes are all negative
        # so we can add them together, but change the sign on the upstream on to make
        # it positive, then divide by the dx for flux but not mass balance, then multiply
        # by dt to get just the change for the small change in time
        change_in_thickness = (
            (((-1 * current_upstream_flux) + current_downstream_flux) / dx)
            + mass_balance_flux
        ) * dt

        # set our new ice elevation
        new_ice_elevation = current_ice_elevation + change_in_thickness

        # no go if our new ice is less than the bed
        if new_ice_elevation < current_bed_elevation:
            new_ice_elevation = current_bed_elevation

        # update our array in place
        ice_elevation[i] = new_ice_elevation


def formatOutputElements():
    out = []
    for i in range(gridpoints):
        out.append(
            {
                "iceElevation": ice_elevation[i],
                "bedElevation": bed_elevation[i],
                "diffusivity_up": 0,
                "flux_up": 0,
                "diffusivity_down": 0,
                "flux_down": 0,
                "totalFlux": 0,
                "massBalanceFlux": 0,
                "iteration": 0,
                "deltaH": 0,
            }
        )
    return out


def formatOutputMidpoints():
    out = []
    for i in range(gridpoints - 1):
        out.append(
            {
                "elementDown": 0,
                "elementUp": 0,
                "diffusivity": 0,
                "slope": 0,
                "flux": midpoint_flux[i],
            }
        )
    return out


# t should just be iteration count, run it out to a million iterations
t = 0

# we'll track model time separately
model_time = 0
start = time.time()
while t < iterations:
    t = t + 1
    calculateFlux()
    calculateThickness()

    # our modeled time is the iteration count times our dt
    model_time = t * dt  # should be in years

    # check our progress every 10 years
    if model_time % 10 == 0:
        # Now save a file out so we can view it in our webpage
        data = {
            "i": t,
            "t": model_time,
            "elements": formatOutputElements(),
            "midpoints": formatOutputMidpoints(),
        }
        outtime = int(model_time)
        outfilename = f"py-out/data-{outtime:04}.json"
        with open(outfilename, "w") as outfile:
            json.dump(data, outfile)

        # print(t, model_time, ice_elevation[0], ice_elevation[100:105])

end = time.time()
print(f"Completed {iterations} iterations in {(end-start)/60} minutes")
