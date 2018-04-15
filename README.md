# lj-demo

A 2D simulation of circular atoms with a Lennard-Jones potential, a simple model system for molecular dynamics.

## Lennard-Jones potential

The [Lennard-Jones potential](https://en.wikipedia.org/wiki/Lennard-Jones_potential) is a force field meant to simulate in a simple way the forces between atoms. The force, instead of being all proportional to the inverse of the square of the distance (like it would happen for a Coulomb-like force) is composed of two components: one, attractive, proportional to the inverse of the distance to the seventh power, and one, repulsive, proportional to the inverse of the distance to the thirteenth power. This makes it so that atoms repel each other if they're very close, but attract each other when they're far, which crudely simulates real-life behaviour.
In this simulation, the LJ potential can be controlled by two parameters:
 * **Radius of attraction**, controlling the equilibrium distance at which the two forces balance each other;
 * **Strength**, controlling the overall intensity of the forces
 
## Langevin thermostat

In order to control the temperature of the system, the simulation also uses a [Langevin thermostat](https://cms.mpi.univie.ac.at/vasp/vasp/Langevin_thermostat.html). This means that the dynamics aren't "true" Newtonian dynamics; the atoms act as if a fluid, or some radiation, continuously exchanged energy with them, cooling or heating them as necessary to bring them to the required equilibrium temperature. This is achieved through the combination of two forces - a viscous friction force that tends to slow down the atoms, and a random force proportional to the desired temperature. The parameters that control the thermostat are two:
* **Temperature**, desired temperature for the atoms to tend to;
* **Acclimatation**, the damping 'gamma' factor of Langevin dynamics, which controls how quickly the atoms will tend to reach that temperature.
